import yaml from 'js-yaml';
import fs from "fs"
import path from "path"

const extractFrontMatter = (markdown) => {
  const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);

  if (match) {
    const frontmatter = yaml.load(match[1]);
    const content = markdown.slice(match[0].length).trim();
    return { frontmatter, content }
  }
  
  return { frontmatter: [], content: markdown }
}

const getProject = (filename) => {
  try {
    const rawProjectData = fs.readFileSync(`./projects/${filename}`, "utf-8")
    return extractFrontMatter(rawProjectData)

  } catch (e) {
    return [];
  }
}

const getProjects = () => {
  try {
    return fs.readdirSync("./projects").reduce(
      (projects, filename) => {
        const slug = path.parse(filename).name
        if(!slug.startsWith(".")){
          projects[slug] =  getProject(filename)
        }
        return projects
      }, {})
  } catch (e) {
    return [];
  }
}

const getInfo = (slug) => {
  try {
    const rawInfoData = fs.readFileSync(`./info/${slug}`, "utf-8")
    return extractFrontMatter(rawInfoData)

  } catch (e) {
    return [];
  }
}

const getInfoList = () => {
  try {
    return fs.readdirSync("./info").reduce(
      (infoList, filename) => {
        const slug = path.parse(filename).name
        if(!slug.startsWith(".")){
          infoList[slug] = getInfo(filename)
        }
        return infoList
      }, {})
  } catch (e) {
    return [];
  }
}

export async function get({ params }) {

  const projects = getProjects();
  const info = getInfoList();

  return {
    body: {
      projects,
      info
    }
  }
}