const fs = require("fs");

exports.getJSONDataFromFile = (directory) => {
  var data = fs.readFileSync(directory, {
    encoding: "utf8",
  });
  return JSON.parse(data);
};
