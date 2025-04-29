import type {TreeNode} from '@/models/tree-node.model'

export function buildTree(
  categories: { id: number; name: string; parentId: number | null }[],
  products: { id: number; name: string; categoryId: number }[]
): TreeNode[] {
  const categoryMap = new Map<number, TreeNode>();

  categories.forEach(category => {
    categoryMap.set(category.id, {
      id: category.id,
      name: category.name,
      type: 'category',
      children: [],
    });
  });

  categories.forEach(category => {
    if (category.parentId !== null) {
      const parent = categoryMap.get(category.parentId);
      const child = categoryMap.get(category.id);
      if (parent && child) {
        parent.children!.push(child);
      }
    }
  });

  products.forEach(product => {
    const categoryNode = categoryMap.get(product.categoryId);
    if (categoryNode) {
      categoryNode.children!.push({
        id: product.id,
        name: product.name,
        type: 'product',
      });
    }
  });

  const tree: TreeNode[] = [];
  categoryMap.forEach(node => {
    const isRoot = categories.find(cat => cat.id === node.id)?.parentId === null;
    if (isRoot) {
      tree.push(node);
    }
  });

  return tree;
}
