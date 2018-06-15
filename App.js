import React, { Component, Children } from "react";
import {
  ARPlane,
  ARNode,
  ARBox,
  ARMaterials,
  ARMaterialProperty,
  ARSKScene,
  ARSKLabel,
  ARSessionProvider,
  ARAnimatedProvider,
  ARTrackingProvider,
  ARPositionProvider
} from "react-reality";
import * as RNFS from "react-native-fs";
import { unzip } from "react-native-zip-archive";
import { ARDualView } from "react-reality-holokit";
const getImage = async (sourceFile, URL) => {
  const path = RNFS.DocumentDirectoryPath + "/" + sourceFile;
  if (await RNFS.exists(path)) {
    return path;
  }
  const { promise, jobId } = RNFS.downloadFile({ fromUrl: URL, toFile: path });
  await promise;
  return path;
};

const getFolder = async (sourcePath, URL) => {
  const path = RNFS.DocumentDirectoryPath + "/" + sourcePath;
  if (await RNFS.exists(path)) {
    return path;
  }
  const zipPath = path + ".zip";
  const { promise, jobId } = RNFS.downloadFile({
    fromUrl: URL,
    toFile: zipPath
  });
  await RNFS.mkdir(path);
  await promise;
  await unzip(zipPath, path);
  const files = await RNFS.readDir(path);
  console.log("Got files from ", zipPath, files);
  return path;
};

class artestHoloKit extends Component {
  state = {
    images: {}
  };
  componentDidMount() {
    (async () => {
      var out = {};
      const url2 =
        "file://" +
        (await getImage(
          "force.png",
          "https://lumiere-a.akamaihd.net/v1/images/avco_payoff_1-sht_v7_lg_32e68793.jpeg?region=118%2C252%2C1384%2C696&width=480"
        ));
      out.force = { width: 0.21, url: url2 };
      const url =
        "file://" +
        (await getImage(
          "gebn.png",
          "https://lh3.googleusercontent.com/proxy/LGEoRHj22MjuDIjiteDqsET8qKON3LBEycfPxfr62D6RStJp97Eaah1DY6h76hrsX5NU5jqmNx78OCl0PsyhCbO_BPfdXLJkWBQ"
        ));
      out.gebn = { width: 0.5, url };
      console.log("Adding images", out);
      console.log("Built out ", out); //https://lh3.googleusercontent.com/proxy/LGEoRHj22MjuDIjiteDqsET8qKON3LBEycfPxfr62D6RStJp97Eaah1DY6h76hrsX5NU5jqmNx78OCl0PsyhCbO_BPfdXLJkWBQ
      this.setState(({ images }) => {
        return { images: { ...images, ...out } };
      });
    })();
  }
  render() {
    return (
      <ARSessionProvider alignment="global">
        <ARDualView>
          <ARAnimatedProvider milliseconds={100}>
            <ARPositionProvider
              sensitivity={0.05}
              didPositionChange={posInfo => {
                if (!posInfo) return null;
                if (!this.state.anchorCount) return null;
                if (this.state.stopTracking) return null;
                this.setState(({ positions }) => {
                  if (!positions) positions = [];
                  return {
                    positions: [
                      ...positions.slice(
                        Math.max(0, positions.length - 50),
                        positions.length
                      ),
                      posInfo.position
                    ]
                  };
                });
              }}
            />
          </ARAnimatedProvider>
          <ARTrackingProvider
            imageDetection
            images={this.state.images}
            didUpdateAnchors={anchors => {
              console.log("I found me an anchor");
              this.setState({ anchorCount: Object.keys(anchors).length });
            }}
          >
            {({ anchors }) => {
              console.log("Drawing with anchors", anchors);
              return Object.keys(anchors)
                .map(k => {
                  if (!k) return null;
                  const v = anchors[k];
                  if (!v) return null;
                  return (
                    <ARNode
                      parentNode={k}
                      id={k + "-child"}
                      key={k}
                      eulerAngles={{
                        x: (-1 * Math.PI) / 2,
                        y: 0,
                        z: 0
                      }}
                    >
                      <ARNode eulerAngles={{ x: Math.PI / 2, y: 0, z: 0 }}>
                        <ARNode scale={0.4} position={{ y: 0.2, x: 0, z: 0 }}>
                          {this.state.positions
                            ? this.state.positions
                                .slice(
                                  0,
                                  Math.max(1, this.state.positions.length - 1)
                                )
                                .map((pos, i) => {
                                  return (
                                    <ARNode
                                      key={i}
                                      id={"motiontest-" + i.toString()}
                                      position={pos}
                                      onPress={() => {
                                        if (!this.state.stopTracking) return;
                                        this.setState(({ colors }) => {
                                          if (!colors) colors = {};
                                          return {
                                            colors: {
                                              ...colors,
                                              ["node-" +
                                              i.toString()]: "#FFFF00"
                                            }
                                          };
                                        });
                                        console.log();
                                      }}
                                    >
                                      <ARBox
                                        height={0.01}
                                        width={0.01}
                                        length={0.01}
                                        chamfer={0.004}
                                      >
                                        <ARMaterials>
                                          <ARMaterialProperty
                                            id="diffuse"
                                            color={
                                              this.state.colors &&
                                              this.state.colors[
                                                "node-" + i.toString()
                                              ]
                                                ? this.state.colors[
                                                    "node-" + i.toString()
                                                  ]
                                                : "#0000FF"
                                            }
                                          />
                                        </ARMaterials>
                                      </ARBox>
                                    </ARNode>
                                  );
                                })
                            : null}
                        </ARNode>
                      </ARNode>
                      <ARPlane
                        height={v.plane.height}
                        width={v.plane.width}
                        length={0.1}
                      >
                        <ARMaterials>
                          <ARMaterialProperty id="diffuse" color={"green"}>
                            <ARSKScene
                              width={v.plane.height * 2000}
                              height={v.plane.width * 2000}
                              color={"#FFFF00"}
                            >
                              <ARSKLabel text={v.name} fontColor={"black"} />
                            </ARSKScene>
                          </ARMaterialProperty>
                        </ARMaterials>
                      </ARPlane>
                    </ARNode>
                  );
                })
                .filter(v => {
                  return !!v;
                });
            }}
          </ARTrackingProvider>
        </ARDualView>
      </ARSessionProvider>
    );
  }
}

export default artestHoloKit;
