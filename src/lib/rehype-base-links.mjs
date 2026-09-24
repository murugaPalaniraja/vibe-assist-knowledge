// Rehype plugin: prefix root-relative links in Markdown ("/redis-caching")
// with the deployment base path, so content authors can always write short
// site-absolute links while the site still works under /<repo-name>/ on
// GitHub Pages project sites.
export default function rehypeBaseLinks({ base = '/' } = {}) {
  const prefix = base.replace(/\/$/, '');
  return (tree) => {
    if (!prefix) return;
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'a') {
        const h = node.properties?.href;
        if (typeof h === 'string' && h.startsWith('/') && !h.startsWith('//') && !h.startsWith(prefix + '/')) {
          node.properties.href = prefix + h;
        }
      }
      if (node.children) node.children.forEach(walk);
    };
    walk(tree);
  };
}
