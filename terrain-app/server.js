const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// GENERATOR (sad je fake terrain, ali radi 100%)
app.post('/generate', (req, res) => {
  const { resolution } = req.body;

  let obj = '';
  let size = resolution;

  // vertices
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let h = Math.sin(x * 0.2) * 10 + Math.cos(y * 0.2) * 10;
      obj += `v ${x} ${h} ${y}\n`;
    }
  }

  // faces (mesh)
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      let i = y * size + x + 1;

      let a = i;
      let b = i + 1;
      let c = i + size;
      let d = i + size + 1;

      obj += `f ${a} ${b} ${c}\n`;
      obj += `f ${b} ${d} ${c}\n`;
    }
  }

  res.send(obj);
});

app.listen(3000, () => {
  console.log('RUN → http://localhost:3000');
});
