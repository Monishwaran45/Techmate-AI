interface FolderNode {
  name: string;
  type: 'file' | 'folder';
  children?: FolderNode[];
}

interface ArchitectureViewerProps {
  structure: FolderNode;
}

function TreeNode({ node, depth = 0 }: { node: FolderNode; depth?: number }) {
  const indent = depth * 20;

  return (
    <div>
      <div
        className="flex items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
        style={{ paddingLeft: `${indent}px` }}
      >
        <span className="mr-2">{node.type === 'folder' ? '📁' : '📄'}</span>
        <span className="text-sm text-gray-900 dark:text-white">{node.name}</span>
      </div>
      {node.children?.map((child, index) => (
        <TreeNode key={index} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function ArchitectureViewer({ structure }: ArchitectureViewerProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Structure</h3>
      <div className="font-mono text-sm">
        <TreeNode node={structure} />
      </div>
    </div>
  );
}
