const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7777;

// 현재 폴더를 정적 파일 경로로 지정
app.use(express.static(path.join(__dirname)));

app.get('/appg', (req, res) => {
    res.sendFile(path.join(__dirname, "app-g-desk-map.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
