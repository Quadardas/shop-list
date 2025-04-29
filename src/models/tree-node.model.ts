export interface TreeNode {
  id: number;
  name: string;
  type: 'category' | 'product';
  children?: TreeNode[];
}
