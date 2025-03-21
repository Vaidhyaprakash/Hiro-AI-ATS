import re
import json
import ollama

def jsonValidator(json_str, json_format):
    prompt = f"""You are a JSON validator. Convert the following malformed JSON into a valid JSON format:
{json_str}
Ensure that:
- The JSON uses proper syntax with consistent quotes.
- All keys and string values are enclosed in double quotes.
- Correct the syntax error key value strings. For example if the key values are as follows:{{\"a\": \"O(1)\"}} fix them by enclosing values in double quotes.
- Validate the entire JSON structure.
- Check for missing closing braces and brackets.
- Dont change text or content or object structure or object key and value strings.
- The error is only in double quotes enclosing and a missing closing brace or bracket.
- Strictly follow the JSON format: {json_format}."""

    response = ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}])
    return response["message"]["content"]

def clean_and_convert_json(model_output, json_format):
    try:
        # Step 1: Extract JSON-like content
        match = re.search(r"\{.*?\}", model_output, re.DOTALL) 
        if not match:
            raise ValueError("No JSON content found")

        json_str = match.group(0)

        # Step 2: Clean JSON string
        json_str = json_str.replace("\n", "")  # Remove newlines
        json_str = re.sub(r'\s+', ' ', json_str)  # Remove excessive spaces
        json_str = json_str.strip()

        # Step 3: Try to convert to JSON object
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            # Try appending a closing brace and parse again
            try:
                json_str = jsonValidator(json_str, json_format)
                print("corrected json string -> ",json_str)
                match1 = re.search(r'```json\s*(.*?)\s*```', json_str, re.DOTALL)
                if not match1:
                    raise ValueError("No JSON content found")

                json_str = match1.group(1)

                # Step 2: Clean JSON string
                json_str = json_str.replace("\n", "")  # Remove newlines
                json_str = json_str.replace('\\"', "")
                json_str = json_str.replace("\\'", "")
                json_str = json_str.replace(", }", " }")
                json_str = json_str.replace(", ]", " ]")
                json_str = re.sub(r'\s+', ' ', json_str)  # Remove excessive spaces
                json_str = json_str.strip()
                print("corrected json -> ",json_str)
                return json.loads(json_str)
            except json.JSONDecodeError as e:
                print("Invalid JSON even after fixing:", e)
                return {
                    "error": "Failed to parse JSON"
                }

    except Exception as e:
        print("Error:", e)
        return {
            "error": str(e)
        }
  
def getJSON(data, json_format):
    json_obj = clean_and_convert_json(data, json_format)
    if json_obj:
        print("Valid JSON Object:", json.dumps(json_obj, indent=4))
    else:
        print("Failed to parse JSON")
    return json_obj