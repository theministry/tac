import fs from "fs"
import path from "path"

const getInfoList = () => {
  try {
    return fs.readdirSync("./static/info").reduce((list, filename) => {
      if(!path.parse(filename).name.startsWith(".")) {
        list.push(path.parse(filename).name)
      }
      return list
    }, [])
  } catch (e) {
    return [];
  }
}

export async function get({ params }) {

  const info = getInfoList();

  return {
    body: {
      info
    }
  }
}