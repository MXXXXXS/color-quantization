import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import Jimp from "jimp";
import Popularity from "./utils/Popularity";
import OctreeNode from "./utils/Octree";
import visualOctree from "./components/visualOctree";

let tc: OctreeNode;
let popu: Popularity;
enum algorithm {
  octree,
  popularity,
}

function App() {
  const [scanFinished, setScanFinished] = useState(false);
  const [alg, setAlg] = useState(0);
  const [themeLevel, setThemeLevel] = useState(2);
  const [img, setImg] = useState(null);
  const [themeColors, setThemeColors] = useState([]);
  const fileSrc = useRef(null);

  const scan = useCallback(() => {
    if (img) {
      setScanFinished(false);
      Jimp.read(URL.createObjectURL(img), (err, img) => {
        if (err) throw err;
        switch (alg) {
          case algorithm.octree: {
            tc = new OctreeNode("", -1);
            break;
          }
          case algorithm.popularity: {
            popu = new Popularity(themeLevel);
            break;
          }
        }
        console.time("scaling");
        img
          .scaleToFit(100, 100)
          .scan(0, 0, img.bitmap.width, img.bitmap.height, function (
            x,
            y,
            idx
          ) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            switch (alg) {
              case algorithm.octree: {
                tc.addColor([red, green, blue]);
                break;
              }
              case algorithm.popularity: {
                popu.addColor([red, green, blue]);
                break;
              }
            }
            if (x == 0 && y == 0) {
              // image scan started
              console.timeEnd("scaling");
              console.time("scanning");
            }
            if (x == img.bitmap.width - 1 && y == img.bitmap.height - 1) {
              // image scan finished
              console.timeEnd("scanning");
              setScanFinished(true);
            }
          });
      });
    }
  }, [img, themeLevel, alg]);

  const handleFileInput = useCallback(() => {
    const fileList = fileSrc.current.files;
    if (fileList.length === 1) {
      setImg(fileList[0]);
    }
  }, []);

  const changeLevel = useCallback((e) => {
    setThemeLevel(parseInt(e.currentTarget.value));
  }, []);

  const getThemeColors = useCallback(() => {
    if (scanFinished) {
      switch (alg) {
        case algorithm.octree: {
          console.time("reducing");
          tc.reduce(themeLevel);
          // visualOctree(tc)
          console.timeEnd("reducing");
          console.log("leaf", tc.leafNum, "live leaf", tc.liveLeafNum);
          // visualOctree(tc)
          console.time("get themeColors");
          const result = tc.themeColors;
          console.timeEnd("get themeColors");
          setThemeColors(result);
          break;
        }
        case algorithm.popularity: {
          console.time("get themeColors");
          setThemeColors(popu.themeColors);
          console.timeEnd("get themeColors");
          break;
        }
      }
    }
  }, [scanFinished, themeLevel, alg]);

  const handleSelection = useCallback((e) => {
    setAlg(parseInt(e.currentTarget.value));
  }, []);

  useEffect(() => {
    // 选择文件后, 算法改变后扫描
    scan();
  }, [img, alg]);
  useEffect(() => {
    // 细粒度改变后, popularity需要扫描
    if (alg === algorithm.popularity) {
      scan();
    }
  }, [themeLevel]);

  return (
    <div className="main">
      <button className="getThemeColors" onClick={getThemeColors}>{scanFinished ? "🦋" : "🐌"}</button>
      <label className="file">
        <input onChange={handleFileInput} ref={fileSrc} type="file"></input>
      </label>
      <label className="">
        <select onChange={handleSelection} value={alg}>
          <option value="0">Octree</option>
          <option value="1">Popularity</option>
        </select>
      </label>
      <label className="level">
        主题色细粒度: {themeLevel}
        <input
          value={themeLevel}
          onChange={changeLevel}
          type="range"
          min="0"
          max="6"
          step="1"
        ></input>
      </label>
      <img src={img ? URL.createObjectURL(img) : ""} className="preview"></img>
      <div className="tiles">
        <ColorTiles themeColors={themeColors}></ColorTiles>
      </div>

      <style jsx>{`
        .main {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: 3rem 400px 1fr;
          grid-row-gap: 20px;
        }
        button {
          font-size: 2rem;
          line-height: 1;
        }
        .file {
          grid-area: 1/1/2/4;
        }
        .level {
          grid-area: 1/4/2/7;
        }
        .getThemeColors {
          grid-area: 1/10/2/13;
          pointer-events: ${scanFinished ? "unset" : "none"};
          background-color: ${scanFinished ? "white" : "grey"};
        }
        .preview {
          object-fit: contain;
          align-self: stretch;
          justify-self: stretch;
          grid-area: 2/1/3/13;
        }
        .tiles {
          grid-area: 3/1/4/13;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          grid-gap: 20px 10px;
        }
      `}</style>
    </div>
  );
}

const ColorTiles = ({ themeColors }) => (
  <>
    {themeColors.map((color: [number, number, number]) => {
      return (
        <div key={Math.random()}>
          <style jsx>{`
            div {
              width: 100px;
              height: 50px;
              background-color: rgb(${color.join(",")});
            }
          `}</style>
        </div>
      );
    })}
  </>
);

ReactDOM.render(<App />, document.querySelector("#root"));
