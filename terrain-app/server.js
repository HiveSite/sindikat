const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Terrarium decode
function decode(r,g,b){
  return (r*256 + g + b/256) - 32768;
}

// lat/lng -> tile
function lngLatToTile(lng, lat, z){
  const n = Math.pow(2, z);
  const x = n * ((lng + 180) / 360);
  const latRad = lat * Math.PI / 180;
  const y = n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2;
  return {x,y};
}

// load tile
async function getTile(z,x,y){
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
  const res = await fetch(url);
  const buffer = await res.buffer();
  const { createCanvas, loadImage } = require('canvas');
  const img = await loadImage(buffer);
  const canvas = createCanvas(256,256);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img,0,0);
  return ctx.getImageData(0,0,256,256).data;
}

// generate OBJ
app.post('/generate', async (req,res)=>{
  try{
    const {bounds,resolution,zoom} = req.body;
    const sw = bounds._southWest;
    const ne = bounds._northEast;

    let points = [];
    let tiles = {};

    for(let y=0;y<resolution;y++){
      const lat = ne.lat - (y/(resolution-1))*(ne.lat-sw.lat);
      for(let x=0;x<resolution;x++){
        const lng = sw.lng + (x/(resolution-1))*(ne.lng-sw.lng);
        const t = lngLatToTile(lng,lat,zoom);
        const tx = Math.floor(t.x), ty = Math.floor(t.y);

        const key = `${tx}_${ty}`;
        if(!tiles[key]){
          tiles[key] = await getTile(zoom,tx,ty);
        }

        const px = Math.floor((t.x-tx)*256);
        const py = Math.floor((t.y-ty)*256);
        const i = (py*256+px)*4;

        const h = decode(
          tiles[key][i],
          tiles[key][i+1],
          tiles[key][i+2]
        );

        points.push(h);
      }
    }

    // build OBJ
    let obj = '';
    const size = resolution;

    for(let i=0;i<points.length;i++){
      const x = i % size;
      const y = Math.floor(i/size);
      obj += `v ${x} ${points[i]/10} ${y}\n`;
    }

    for(let y=0;y<size-1;y++){
      for(let x=0;x<size-1;x++){
        let i = y*size + x + 1;
        obj += `f ${i} ${i+1} ${i+size}\n`;
        obj += `f ${i+1} ${i+size+1} ${i+size}\n`;
      }
    }

    res.send(obj);

  }catch(e){
    console.log(e);
    res.status(500).send("error");
  }
});

app.listen(3000, ()=>console.log("http://localhost:3000"));
