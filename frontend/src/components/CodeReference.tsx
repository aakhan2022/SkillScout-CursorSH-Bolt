import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, FileText, FileCode, FileJson, FileCog, FilePen, File, Search, X, RefreshCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { repositoryService } from '../services/repository';
import type { FileNode, FileSummary } from '../services/repository';

export default function CodeReference() {
  const { projectId } = useParams();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileSummary, setFileSummary] = useState<FileSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FileNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    if (!projectId) return;
    
    const fetchFileStructure = async () => {
      setLoading(true);
      try {
        const structure = await repositoryService.getFileStructure(projectId);
        setFileTree(structure);
      } catch (error) {
        console.error('Failed to fetch file structure:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFileStructure();
  }, [projectId]);
  
  // Handle folder expansion/collapse
  const toggleFolder = (path: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (expandedFolders.has(path)) {
      newExpandedFolders.delete(path);
    } else {
      newExpandedFolders.add(path);
    }
    setExpandedFolders(newExpandedFolders);
  };
  
  // Handle file selection
  const handleFileSelect = async (file: FileNode) => {
    setSelectedFile(file);
    
    if (file.type !== 'file') return;
    
    try {
      // Fetch file content
      const content = await repositoryService.getFileContent(projectId!, file.path);
      setFileContent(content);
      
      // Generate file summary
      const summary = await repositoryService.generateFileSummary(projectId!, file.path);
      setFileSummary(summary);
    } catch (error) {
      console.error(`Error loading file ${file.path}:`, error);
    }
  };
  
  // Search functionality
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Recursive function to find matching files
    const findMatches = (nodes: FileNode[]): FileNode[] => {
      let matches: FileNode[] = [];
      
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(term.toLowerCase())) {
          matches.push(node);
        }
        
        if (node.type === 'directory' && node.children) {
          matches = [...matches, ...findMatches(node.children)];
        }
      }
      
      return matches;
    };
    
    setSearchResults(findMatches(fileTree));
  };
  
  // Get file icon based on file extension
  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return expandedFolders.has(file.path) ? 
        <FolderOpen size={18} className="text-yellow-400" /> : 
        <Folder size={18} className="text-yellow-400" />;
    }
    
    const ext = file.extension || file.name.split('.').pop() || '';
    
    switch (ext.toLowerCase()) {
      case 'ts':
      case 'tsx':
        return <FileCode size={18} className="text-blue-400" />;
      case 'js':
      case 'jsx':
        return <FileCode size={18} className="text-yellow-400" />;
      case 'json':
        return <FileJson size={18} className="text-green-400" />;
      case 'html':
        return <FileText size={18} className="text-orange-400" />;
      case 'css':
      case 'scss':
        return <FilePen size={18} className="text-purple-400" />;
      case 'md':
        return <FileText size={18} className="text-gray-400" />;
      case 'config.js':
      case 'config.ts':
        return <FileCog size={18} className="text-gray-400" />;
      default:
        return <File size={18} className="text-gray-400" />;
    }
  };
  
  // Render file tree recursively
  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <button
          onClick={() => node.type === 'directory' ? 
            toggleFolder(node.path) : 
            handleFileSelect(node)
          }
          className={`flex items-center py-2 px-2 text-left w-full rounded hover:bg-gray-700/50 transition-colors ${
            selectedFile?.path === node.path ? 'bg-blue-900/30 text-blue-400' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${(level * 16) + 8}px` }}
        >
          {node.type === 'directory' && (
            <span className={`transform transition-transform ${
              expandedFolders.has(node.path) ? 'rotate-90' : ''
            } mr-1`}>
              ›
            </span>
          )}
          
          {node.type === 'file' && <span className="w-4" />}
          
          <span className="mr-2">{getFileIcon(node)}</span>
          <span className="truncate">{node.name}</span>
          
          {node.size && (
            <span className="ml-auto text-xs text-gray-500">
              {formatFileSize(node.size)}
            </span>
          )}
        </button>
        
        {node.type === 'directory' && 
          expandedFolders.has(node.path) && 
          node.children && 
          renderFileTree(node.children, level + 1)
        }
      </div>
    ));
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Render search results
  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <div className="text-gray-400 text-center py-4">
          No files found matching "{searchTerm}"
        </div>
      );
    }
    
    return searchResults.map((file) => (
      <button
        key={file.path}
        onClick={() => handleFileSelect(file)}
        className={`flex items-center py-2 px-3 text-left w-full rounded hover:bg-gray-700/50 transition-colors ${
          selectedFile?.path === file.path ? 'bg-blue-900/30 text-blue-400' : 'text-gray-300'
        }`}
      >
        <span className="mr-2">{getFileIcon(file)}</span>
        <span className="truncate">{file.path}</span>
      </button>
    ));
  };
  
  const FileSummaryView = () => {
    if (!selectedFile) {
      return (
        <div className="bg-[#1a1f2e] rounded-lg p-8 text-center text-gray-400">
          Select a file to view its details and AI-powered summary
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">File Summary</h2>
          <p className="text-gray-400 mb-3">
            Here is a brief descriptive overview of the <code className="bg-[#0A0C10] px-2 py-1 rounded">{selectedFile.path}</code> file:
          </p>
          
          <div className="bg-[#0A0C10] rounded-lg p-4 border border-gray-800">
            {summaryLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Purpose</h3>
                  <p className="text-gray-200">{fileSummary?.purpose}</p>
                </div>
                
                {fileSummary?.components && fileSummary.components.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Key Components</h3>
                    <div className="flex flex-wrap gap-2">
                      {fileSummary.components.map((component, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-gray-800 rounded-md text-blue-400 text-sm"
                        >
                          {component}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {fileSummary?.dependencies && fileSummary.dependencies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Dependencies</h3>
                    <div className="flex flex-wrap gap-2">
                      {fileSummary.dependencies.map((dep, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-gray-800 rounded-md text-green-400 text-sm"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Description</h3>
                  <p className="text-gray-300">{fileSummary?.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">File Content</h2>
          <div className="bg-[#0A0C10] rounded-lg p-4 border border-gray-800 overflow-auto max-h-96">
            <pre className="text-sm text-gray-300">
              <code>{fileContent}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* File Tree Panel */}
      <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:border-blue-500 text-white"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* File Browser */}
        <div className="bg-[#1a1f2e] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <h3 className="font-medium">Project Files</h3>
            <button 
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
              title="Refresh file tree"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="overflow-auto max-h-[calc(100vh-300px)]">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                Loading file structure...
              </div>
            ) : isSearching ? (
              <div className="p-3 space-y-1">
                {renderSearchResults()}
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {renderFileTree(fileTree)}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* File Details Panel */}
      <div className="col-span-12 md:col-span-8 lg:col-span-9">
        <div className="bg-[#1a1f2e] rounded-lg p-6">
          <FileSummaryView />
        </div>
      </div>
    </div>
  );
}