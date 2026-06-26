interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  model: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      temperature,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  const finishReason = data.choices?.[0]?.finish_reason;

  if (!text) {
    throw new Error(`OpenAI returned an empty response (${finishReason || "unknown"})`);
  }

  return text;
}

function parseModelJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [fenced?.[1]?.trim(), raw.trim()].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      const normalized = candidate
        .replace(/'/g, '"')
        .replace(/(\w)"(\w)/g, "$1'$2");
      try {
        return JSON.parse(normalized);
      } catch {
        continue;
      }
    }
  }

  throw new Error("Unable to parse model JSON response");
}

function normalizeToArray(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    return parsed as Record<string, unknown>[];
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    for (const key of ["questions", "data", "items", "results"]) {
      if (Array.isArray(record[key])) {
        return record[key] as Record<string, unknown>[];
      }
    }

    const values = Object.values(record);
    if (values.every((value) => value && typeof value === "object")) {
      return values as Record<string, unknown>[];
    }
  }

  throw new Error("Output format not in a list of json");
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = DEFAULT_OPENAI_MODEL,
  temperature: number = 0.7,
  num_tries: number = 5,
  verbose: boolean = false
): Promise<
  {
    question: string;
    answer: string;
  }[]
> {
  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    if (list_input) {
      output_format_prompt += `\nGenerate one JSON object for each input element. Return a JSON object with a "questions" key containing the array of results.`;
    } else {
      output_format_prompt += `\nReturn a JSON object with a "questions" key containing an array with one result object.`;
    }

    const raw = await generateWithOpenAI(
      system_prompt + output_format_prompt + error_msg,
      Array.isArray(user_prompt) ? user_prompt.join("\n") : user_prompt,
      temperature,
      model
    );

    if (verbose) {
      console.log(
        "System prompt:",
        system_prompt + output_format_prompt + error_msg
      );
      console.log("\nUser prompt:", user_prompt);
      console.log("\nOpenAI response:", raw);
    }

    try {
      let output = normalizeToArray(parseModelJson(raw));

      if (!list_input) {
        output = [output[0]];
      }

      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          if (/<.*?>/.test(key)) {
            continue;
          }

          if (!(key in output[index])) {
            throw new Error(`${key} not in json output`);
          }

          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            const value = output[index][key];
            if (Array.isArray(value)) {
              output[index][key] = value[0];
            }
            if (
              typeof output[index][key] === "string" &&
              !choices.includes(output[index][key] as string) &&
              default_category
            ) {
              output[index][key] = default_category;
            }
            if (
              typeof output[index][key] === "string" &&
              (output[index][key] as string).includes(":")
            ) {
              output[index][key] = (output[index][key] as string).split(":")[0];
            }
          }
        }

        if (output_value_only) {
          output[index] = Object.values(output[index]);
          if (output[index].length === 1) {
            output[index] = output[index][0];
          }
        }
      }

      return output as { question: string; answer: string }[];
    } catch (e) {
      error_msg = `\n\nResult: ${raw}\n\nError message: ${e}`;
      console.log("An exception occurred:", e);
      console.log("Current invalid json format:", raw);
    }
  }

  return [];
}
