const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 현재 폴더를 정적 파일 경로로 지정
app.use(express.static(path.join(__dirname)));

// 모든 요청에 대해 index.html을 반환 (SPA 지원)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
