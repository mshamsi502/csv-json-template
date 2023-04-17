var path = require("path")
var fsExtra = require("fs-extra")
var fs = require("fs")
var busboy = require("connect-busboy")
const createCsvWriter = require("csv-writer").createObjectCsvWriter
const express = require("express")
const CSVToJSON = require("csvtojson")
var path = require("path")

const app = express()
app.use(busboy())
console.log("dir : ", __dirname)

app.use(express.static(path.join(__dirname, "public")))

const port = 7000

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.route("/csvToJson").post(function (req, res, next) {
  var fstream
  req.pipe(req.busboy)
  req.busboy.on("file", function (fieldname, file, filename) {
    const _fileName = filename["filename"].split(".")[0]
    const _fileType = filename["filename"].split(".")[1]
    const _fileMimeType = filename["mimeType"].replace("/", "-")

    fstream = fsExtra.createWriteStream(
      __dirname +
        "/uploadedFiles/" +
        _fileMimeType +
        "/output/" +
        _fileName +
        "." +
        _fileType
    )

    file.pipe(fstream)
    fstream.on("close", function () {
      console.log("Upload Finished of " + _fileName + "." + _fileType)
      CSVToJSON()
        .fromFile(
          __dirname +
            "/uploadedFiles/" +
            _fileMimeType +
            "/input/" +
            _fileName +
            "." +
            _fileType
        )
        .then((data) => {
          // var jsonContent = JSON.stringify(data)
          fs.writeFile(
            __dirname +
              "/uploadedFiles/" +
              "jsonOutput" +
              "/" +
              _fileName +
              ".json",
            JSON.stringify(data),
            "utf8",
            function (err) {
              if (err) {
                console.log(
                  "An error occured while writing JSON Object to File."
                )
                return console.log(err)
              }
              console.log("JSON file has been saved.")
              res.send(data)
            }
          )
        })
    })
  })
})

app.route("/getCSV").get(function (req, res, next) {
  const _fileName = "data"
  const _fileType = "json"
  const _outFileType = "csv"
  const _fileMimeType = "text-csv"

  if (req.query.fileName === _fileName + "." + _fileType) {
    jsonObj = JSON.parse(
      fsExtra.readFileSync(
        __dirname +
          "/uploadedFiles/" +
          "/jsonOutput/" +
          _fileName +
          "." +
          _fileType
      )
    )
    // const _headers = Object.keys(jsonObj[0])

    const _headers = []
    Object.keys(jsonObj[0]).map((key) =>
      _headers.push({
        id: key,
        title: key,
      })
    )
    const _path =
      __dirname +
      "/uploadedFiles/" +
      _fileMimeType +
      "/output/" +
      _fileName +
      "." +
      _outFileType
    const csvWriter = createCsvWriter({
      header: _headers,
      path: _path,
    })
    csvWriter.writeRecords(jsonObj).then(() => {
      ReceivedCSVObj = fsExtra.readFileSync(_path)
      console.log("ReceivedCSVObj : ", ReceivedCSVObj)
      console.log("...Done")
      res.set(
        "Content-disposition",
        "attachment; filename=" + "output_" + _fileName + "." + _outFileType
      )
      res.set("Content-Type", "text/plain")
      res.send(ReceivedCSVObj)
    })
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
