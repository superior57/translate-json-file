const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { CONFIG_API } = require("./config");
const { getJSONDataFromFile } = require("./src/global");

//
const readTextListFromOriginalJsonFile = async (
  original_file_name,
  target_file_name,
  is_new = false
) => {
  const original_file_directory = path.join(
    __dirname,
    "original",
    original_file_name
  );
  var original_data = getJSONDataFromFile(original_file_directory);

  const target_file_directory = path.join(
    __dirname,
    "result",
    target_file_name
  );

  if (!is_new && fs.existsSync(target_file_directory)) {
    var target_data = getJSONDataFromFile(target_file_directory);

    Object.keys(target_data).forEach((key) => {
      if (original_data[key]) delete original_data[key];
    });
  }

  return {
    keys: Object.keys(original_data),
    texts: Object.values(original_data).map((text) => {
      let str = text.replace(/’/g, "'");
      return str;
    }),
  };
};

//
const writeResultFile = (target_file_name, keys, texts, is_new = false) => {
  const target_file_directory = path.join(
    __dirname,
    "result",
    target_file_name
  );

  var data = {};
  if (fs.existsSync(target_file_directory)) {
    if (is_new) fs.rmSync(target_file_directory);
    const exist_data = getJSONDataFromFile(target_file_directory);
    data = { ...exist_data };
  }

  keys.forEach((key, _i) => {
    data[key] = texts[_i];
  });

  data = JSON.stringify(data, null, 2);

  fs.writeFileSync(target_file_directory, data);
};

//
const getTranslatedTextList = async (text_list, target_language) => {
  if (text_list.length < 1) {
    const error = new Error("text does not exists to be translated");
    throw error;
  }

  var params = getParams(CONFIG_API.auth_key, target_language, text_list);
  const path = "/translate";
  const url = CONFIG_API.endpoint + path + params;

  const response = await axios.post(url);
  const translations = response?.data?.translations;
  const translated_texts = translations.map((t) => t.text);

  return translated_texts;
};

// --
const getParams = (auth_key, target_lang, text_list = []) => {
  let str = "";

  str += `?auth_key=${auth_key}`;
  str += `&target_lang=${target_lang}`;

  text_list.forEach((text) => {
    str += `&text=${text}`;
  });

  return str;
};

// -------------------------------

const main = async () => {
  try {
    const input_file_name = "en.json";
    const target_file_name = "pt-br.json";
    const target_language = "PT-BR";
    const is_generate_newly = false; // If this value is FALSE, then does not process translate for already exists keys

    console.log("reading json data from file");
    const { keys, texts } = await readTextListFromOriginalJsonFile(
      input_file_name,
      target_file_name,
      is_generate_newly
    );

    console.log("attempting to translate texts");
    const translatedTextList = await getTranslatedTextList(
      texts,
      target_language
    );

    console.log("writing translated text to target file");
    writeResultFile(
      target_file_name,
      keys,
      translatedTextList,
      is_generate_newly
    );

    console.log("successed!");
  } catch (error) {
    console.error(error);
  }
};

main();

// --------------------
