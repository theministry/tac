import fs from "fs"
import path from "path"

const getProjects = () => {
  try {
    return fs.readdirSync("./static/projects").reduce((list, filename) => {
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

  const projects = getProjects();

  return {
    body: {
      projects
    }
  }
}