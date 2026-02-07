const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
var path = require('path');
const app = express();

app.use(cors());
const port = 3000;
let imageList = listImages();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/unsorted/Lissi2.jpg');
});

app.get('/image/:md5', (req, res) => {
    let image;
    let md5 = req.params.md5.trim();
    try {
        image = imageList[md5];
    } catch (e) {
        console.log(e);
    }
    res.sendFile(image.filePath);
});

app.get('/meta/:md5', (req, res) => {
    let image;
    let md5 = req.params.md5.trim();
    try {
        image = imageList[md5];
    } catch (e) {
        console.log(e);
    }
    res.json(image);
});

app.get('/unsortedFiles', (req, res) => {
    imageList = listImages();
    res.json(imageList);
});

app.get('/folders', (req, res) => {
    res.json(listFolders());
});

app.get('/newFolder/:folderName', (req, res) => {
    let response = {};
    try {
        fs.mkdirSync('./sorted/' + req.params.folderName);
        response = { result: 'success', message: `${req.params.folderName} created!` };
    } catch (e) {
        response = { result: 'error', message: e };
    }
    console.log(response);
    res.json(response);
});

app.get('/moveImage/:md5/:folderName', (req, res) => {
    let md5 = req.params.md5.trim();
    let folder = req.params.folderName;
    let response = {};
    let image = {};

    if (!fs.existsSync('./sorted/${folder}/')) {
        try {
            fs.mkdirSync('./sorted/' + req.params.folderName);
            response = { result: 'success', message: `${req.params.folderName} created!` };
        } catch (e) {
            response = { result: 'error', message: e };
        }
        console.log(response);
    }

    try {
        image = imageList[md5];
    } catch (e) {
        response = { result: 'error', message: 'file not found' };
    }
    if (image && Object.keys(image).length > 0) {
        try {
            fs.renameSync(image.filePath, `./sorted/${folder}/${image.fileName}`);
            response = { result: 'success', message: `${image.filePath} moved to ./sorted/${folder}/${image.fileName}` };
        } catch (e) {
            response = { result: 'error', message: e };
        }
    }
    console.log(response);
    res.json(response);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

function listFolders() {
    folders = fs
        .readdirSync('./sorted', { withFileTypes: true })
        .filter((dir) => dir.isDirectory())
        .filter((dir) => !/20[0-9]{2}$/g.test(dir.name))
        .filter((dir) => dir.name != 'sort-deleted');
    return { folders: folders };
}

function listImages() {
    fileList = {};
    count = 0;
    files = fs.readdirSync('./unsorted').filter((file) => ['.jpg', '.jpeg', '.png', '.bmp'].includes(path.extname(file).toLowerCase()));

    files.forEach((file) => {
        count++;
        fullPath = __dirname + '/unsorted/' + file;
        md5 = md5sum(fullPath);
        fileData = {
            md5: md5,
            fileName: file,
            filePath: fullPath,
            fileStat: fs.statSync(fullPath),
        };
        fileList[md5] = fileData;
        console.log(`File ${count} of ${files.length}`);
    });

    return fileList;
}

function md5sum(path) {
    const hash = crypto.createHash('md5');
    const file = fs.readFileSync(path);
    hash.update(file);
    return hash.digest('hex');
}
