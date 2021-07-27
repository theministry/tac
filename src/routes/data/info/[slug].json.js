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

const getInfo = (slug) => {
  try {
    const rawInfoData = fs.readFileSync(path.resolve("./public", `info/${slug}.md`), "utf-8")
    return extractFrontMatter(rawInfoData)

  } catch (e) {
    return [];
  }
}

export async function get({ params }) {
  const { slug } = params
  const { frontmatter, content } = getInfo(slug);

  return {
    body: {
      frontmatter, content
    }
  }
}