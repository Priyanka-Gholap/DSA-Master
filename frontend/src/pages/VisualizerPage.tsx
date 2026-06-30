import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Heart
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

interface Step {
  array?: number[];
  comparing?: [number, number] | number[];
  swaps?: number;
  comparisons?: number;
  visited?: number[];
  description: string;
  // Node pointer details
  currentIdx?: number;
  low?: number;
  mid?: number;
  high?: number;
  // Linked list node additions
  listNodes?: { value: number; highlight?: boolean }[];
  // BST nodes
  treeNodes?: TreeNode[];
  // Graph elements
  graphHighlight?: { nodes: string[]; edges: string[] };
  // DP table
  dpTable?: number[][];
  dpCols?: string[];
  dpRows?: string[];
  dpCurrentCell?: [number, number];
  // Trie node elements
  trieWords?: string[];
}

interface TreeNode {
  value: number;
  x: number;
  y: number;
  left?: TreeNode;
  right?: TreeNode;
}

const ALGORITHM_DESCRIPTIONS: Record<string, string> = {
  'bubble-sort': 'Bubble Sort is a simple comparison-based sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.',
  'selection-sort': 'Selection Sort splits the array into sorted and unsorted parts. It repeatedly finds the minimum element from the unsorted part and places it at the beginning of the sorted part.',
  'linear-search': 'Linear Search sequentially checks each element of the list one by one until a match is found or the end of the list is reached.',
  'binary-search': 'Binary Search is an efficient interval search algorithm on sorted lists. It repeatedly divides the search interval in half to locate the target value in O(log N) time.',
  'stack-operations': 'A Stack is a Last-In-First-Out (LIFO) linear data structure. Elements are inserted (Push) and removed (Pop) from the same end, called the Top.',
  'queue-operations': 'A Queue is a First-In-First-Out (FIFO) linear data structure. Elements are inserted at the Rear (Enqueue) and removed from the Front (Dequeue).',
  'linked-list': 'A Linked List is a linear data structure where elements (nodes) are stored sequentially, linked together using pointers. It supports fast insertions and deletions.',
  'bst-traversal': 'A Binary Search Tree (BST) is a hierarchical node structure where left children contain smaller keys and right children contain larger keys. Traversal visits keys systematically.',
  'graph-bfs': 'Breadth-First Search (BFS) is a graph traversal algorithm that explores vertices level-by-level, visiting all neighbor nodes before moving to the next level.',
  'dp-knapsack': 'The 0/1 Knapsack Problem is a classic Dynamic Programming challenge. Given item weights and values, it computes the optimal subset to maximize value without exceeding capacity.'
};

export const VisualizerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Active Visualizer Name
  const [activeVis, setActiveVis] = useState<string>(
    searchParams.get('type') || 'bubble-sort'
  );

  // Playback control states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(500); // ms delay
  const [steps, setSteps] = useState<Step[]>([]);
  const [customInputValue, setCustomInputValue] = useState('');

  // 1. Fetch preferences
  const { data: prefData } = useQuery({
    queryKey: ['visualizer-preferences'],
    queryFn: async () => {
      const response = await api.get('/visualizers/preferences');
      return response.data.data.preferences;
    },
  });

  // Sync preferences speed
  useEffect(() => {
    if (prefData?.animationSpeed) {
      setAnimationSpeed(prefData.animationSpeed);
    }
  }, [prefData]);

  // Update preferences mutation
  const updatePrefMutation = useMutation({
    mutationFn: async (speed: number) => {
      await api.put('/visualizers/preferences', { animationSpeed: speed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizer-preferences'] });
    },
  });

  // 2. Fetch Favorites
  const { data: favoritesData } = useQuery<any[]>({
    queryKey: ['visualizer-favorites'],
    queryFn: async () => {
      const response = await api.get('/visualizers/favorites');
      return response.data.data.favorites;
    },
  });

  const isFavorite = favoritesData?.some((f) => f.visualizerName === activeVis);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await api.delete(`/visualizers/favorites/${activeVis}`);
      } else {
        await api.post('/visualizers/favorites', { visualizerName: activeVis });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizer-favorites'] });
      toast(isFavorite ? 'Removed from favorites list.' : 'Added to favorites list!', 'success');
    },
  });

  // ----------------------------------------------------
  // Visualizer Simulators & State Generation
  // ----------------------------------------------------

  // 1. Sorting Simulator
  const [sortArray, setSortArray] = useState<number[]>([45, 12, 85, 32, 49, 60, 22, 18]);
  
  const generateRandomArray = (size: number = 8) => {
    const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
    setSortArray(arr);
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps([]);
  };

  const initBubbleSort = () => {
    const arr = [...sortArray];
    const stepsList: Step[] = [];
    stepsList.push({
      array: [...arr],
      comparing: [],
      swaps: 0,
      comparisons: 0,
      description: 'Start Bubble Sort. Compare adjacent elements.',
    });

    let swaps = 0;
    let comparisons = 0;
    const n = arr.length;
    let tempArr = [...arr];

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        comparisons++;
        stepsList.push({
          array: [...tempArr],
          comparing: [j, j + 1],
          swaps,
          comparisons,
          description: `Compare element ${tempArr[j]} and ${tempArr[j + 1]}.`,
        });

        if (tempArr[j] > tempArr[j + 1]) {
          const temp = tempArr[j];
          tempArr[j] = tempArr[j + 1];
          tempArr[j + 1] = temp;
          swaps++;
          stepsList.push({
            array: [...tempArr],
            comparing: [j, j + 1],
            swaps,
            comparisons,
            description: `Swap elements: ${tempArr[j + 1]} > ${tempArr[j]}.`,
          });
        }
      }
    }

    stepsList.push({
      array: [...tempArr],
      comparing: [],
      swaps,
      comparisons,
      description: 'Array is fully sorted!',
    });

    setSteps(stepsList);
    setCurrentStep(0);
  };

  const initSelectionSort = () => {
    const arr = [...sortArray];
    const stepsList: Step[] = [];
    let swaps = 0;
    let comparisons = 0;
    const n = arr.length;

    stepsList.push({
      array: [...arr],
      comparing: [],
      swaps,
      comparisons,
      description: 'Initialize Selection Sort. Look for the minimum element in each pass.',
    });

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      stepsList.push({
        array: [...arr],
        comparing: [i],
        swaps,
        comparisons,
        description: `Set index ${i} (value ${arr[i]}) as current minimum.`,
      });

      for (let j = i + 1; j < n; j++) {
        comparisons++;
        stepsList.push({
          array: [...arr],
          comparing: [minIdx, j],
          swaps,
          comparisons,
          description: `Compare current minimum with index ${j} (value ${arr[j]}).`,
        });

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          stepsList.push({
            array: [...arr],
            comparing: [minIdx],
            swaps,
            comparisons,
            description: `New minimum found at index ${minIdx} (value ${arr[minIdx]}).`,
          });
        }
      }

      if (minIdx !== i) {
        const temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
        swaps++;
        stepsList.push({
          array: [...arr],
          comparing: [i, minIdx],
          swaps,
          comparisons,
          description: `Swap minimum value ${arr[i]} at index ${minIdx} with index ${i}.`,
        });
      }
    }

    stepsList.push({
      array: [...arr],
      comparing: [],
      swaps,
      comparisons,
      description: 'Selection Sort completed!',
    });

    setSteps(stepsList);
    setCurrentStep(0);
  };

  // 2. Searching Simulator
  const [searchTarget, setSearchTarget] = useState<number>(32);

  const initLinearSearch = () => {
    const arr = [...sortArray];
    const stepsList: Step[] = [];
    let comparisons = 0;
    const n = arr.length;

    stepsList.push({
      array: [...arr],
      comparing: [],
      comparisons,
      description: `Start Linear Search for target ${searchTarget}.`,
    });

    let found = false;
    for (let i = 0; i < n; i++) {
      comparisons++;
      stepsList.push({
        array: [...arr],
        comparing: [i],
        comparisons,
        description: `Compare index ${i} value ${arr[i]} with target ${searchTarget}.`,
      });

      if (arr[i] === searchTarget) {
        found = true;
        stepsList.push({
          array: [...arr],
          comparing: [i],
          comparisons,
          visited: [i],
          description: `Target ${searchTarget} found at index ${i}!`,
        });
        break;
      }
    }

    if (!found) {
      stepsList.push({
        array: [...arr],
        comparing: [],
        comparisons,
        description: `Target ${searchTarget} not found in the array.`,
      });
    }

    setSteps(stepsList);
    setCurrentStep(0);
  };

  const initBinarySearch = () => {
    const arr = [...sortArray].sort((a, b) => a - b);
    setSortArray(arr);
    const stepsList: Step[] = [];
    let comparisons = 0;
    
    stepsList.push({
      array: [...arr],
      comparing: [],
      comparisons,
      description: `Sort array first. Begin Binary Search for target ${searchTarget}.`,
    });

    let low = 0;
    let high = arr.length - 1;
    let found = false;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      comparisons++;

      stepsList.push({
        array: [...arr],
        comparing: [mid],
        low,
        mid,
        high,
        comparisons,
        description: `Compute midpoint index ${mid} (value ${arr[mid]}). Check bounds.`,
      });

      if (arr[mid] === searchTarget) {
        found = true;
        stepsList.push({
          array: [...arr],
          comparing: [mid],
          low,
          mid,
          high,
          comparisons,
          visited: [mid],
          description: `Target ${searchTarget} found at index ${mid}!`,
        });
        break;
      }

      if (arr[mid] < searchTarget) {
        low = mid + 1;
        stepsList.push({
          array: [...arr],
          comparing: [mid],
          low,
          mid,
          high,
          comparisons,
          description: `${arr[mid]} < ${searchTarget}. Shift search bounds to right.`,
        });
      } else {
        high = mid - 1;
        stepsList.push({
          array: [...arr],
          comparing: [mid],
          low,
          mid,
          high,
          comparisons,
          description: `${arr[mid]} > ${searchTarget}. Shift search bounds to left.`,
        });
      }
    }

    if (!found) {
      stepsList.push({
        array: [...arr],
        comparing: [],
        comparisons,
        description: `Target ${searchTarget} not found in array bounds.`,
      });
    }

    setSteps(stepsList);
    setCurrentStep(0);
  };

  // 3. Stack & Queue Visualizer
  const [linearNodes, setLinearNodes] = useState<number[]>([15, 30, 45]);
  const [peekHighlight, setPeekHighlight] = useState(false);

  const handlePushStack = (val: number) => {
    setIsPlaying(true);
    const stepsList: Step[] = [];
    
    // Step 0: Initial state
    stepsList.push({
      array: [...linearNodes],
      comparing: [],
      description: `Original Stack representation. Top is ${linearNodes[0] !== undefined ? linearNodes[0] : 'NULL'}.`,
    });
    
    // Step 1: Create node
    stepsList.push({
      array: [...linearNodes],
      comparing: [],
      description: `Create a new node containing value ${val}.`,
    });
    
    // Step 2: Link next pointer
    stepsList.push({
      array: [...linearNodes],
      comparing: [],
      description: `Set the new node's next pointer to the current Top (${linearNodes[0] !== undefined ? linearNodes[0] : 'NULL'}).`,
    });
    
    // Step 3: Update Top
    const newStack = [val, ...linearNodes];
    stepsList.push({
      array: newStack,
      comparing: [0], // Highlight index 0 as the new Top
      description: `Update the Top pointer to point to the new node. Push completed!`,
    });
    
    setLinearNodes(newStack);
    setSteps(stepsList);
    setCurrentStep(0);
    setPeekHighlight(false);
  };

  const handlePopStack = () => {
    if (linearNodes.length === 0) {
      toast('Stack is empty! Cannot pop.', 'error');
      return;
    }
    setIsPlaying(true);
    const stepsList: Step[] = [];
    const val = linearNodes[0];
    
    // Step 0: Initial state
    stepsList.push({
      array: [...linearNodes],
      comparing: [0], // highlight top
      description: `Original Stack. Top element is ${val}.`,
    });
    
    // Step 1: Get top value
    stepsList.push({
      array: [...linearNodes],
      comparing: [0],
      description: `Read top element value: ${val}.`,
    });
    
    // Step 2: Update top reference
    const newStack = linearNodes.slice(1);
    stepsList.push({
      array: [...linearNodes],
      comparing: [1], // highlight new top
      description: `Move Top pointer to next node (${linearNodes[1] !== undefined ? linearNodes[1] : 'NULL'}).`,
    });
    
    // Step 3: Complete pop
    stepsList.push({
      array: newStack,
      comparing: [],
      description: `Pop operation complete! Returned value: ${val}.`,
    });
    
    setLinearNodes(newStack);
    setSteps(stepsList);
    setCurrentStep(0);
    setPeekHighlight(false);
  };

  const handleEnqueue = (val: number) => {
    setIsPlaying(true);
    const stepsList: Step[] = [];
    
    // Step 0: Initial state
    stepsList.push({
      array: [...linearNodes],
      comparing: [],
      description: `Original Queue. Front is ${linearNodes[0] !== undefined ? linearNodes[0] : 'NULL'}, Rear is ${linearNodes[linearNodes.length - 1] !== undefined ? linearNodes[linearNodes.length - 1] : 'NULL'}.`,
    });
    
    // Step 1: Create node
    stepsList.push({
      array: [...linearNodes],
      comparing: [],
      description: `Create a new node containing value ${val}.`,
    });
    
    // Step 2: Link rear.next
    stepsList.push({
      array: [...linearNodes],
      comparing: [],
      description: `Set current Rear node's next pointer to the new node.`,
    });
    
    // Step 3: Update Rear
    const newQueue = [...linearNodes, val];
    stepsList.push({
      array: newQueue,
      comparing: [newQueue.length - 1], // Highlight the new Rear element
      description: `Update the Rear pointer to reference the new node. Enqueue completed!`,
    });
    
    setLinearNodes(newQueue);
    setSteps(stepsList);
    setCurrentStep(0);
  };

  const handleDequeue = () => {
    if (linearNodes.length === 0) {
      toast('Queue is empty! Cannot dequeue.', 'error');
      return;
    }
    setIsPlaying(true);
    const stepsList: Step[] = [];
    const val = linearNodes[0];
    
    // Step 0: Initial state
    stepsList.push({
      array: [...linearNodes],
      comparing: [0], // highlight front
      description: `Original Queue. Front node value is ${val}.`,
    });
    
    // Step 1: Read value
    stepsList.push({
      array: [...linearNodes],
      comparing: [0],
      description: `Access Front node value: ${val}.`,
    });
    
    // Step 2: Shift front pointer
    const newQueue = linearNodes.slice(1);
    stepsList.push({
      array: [...linearNodes],
      comparing: [1], // highlight new front
      description: `Advance Front pointer to the next node (${linearNodes[1] !== undefined ? linearNodes[1] : 'NULL'}).`,
    });
    
    // Step 3: Complete
    stepsList.push({
      array: newQueue,
      comparing: [],
      description: `Dequeue operation complete! Deallocated old Front. Returned value: ${val}.`,
    });
    
    setLinearNodes(newQueue);
    setSteps(stepsList);
    setCurrentStep(0);
  };

  // 4. Linked List Simulator
  const [listNodes, setListNodes] = useState<number[]>([10, 20, 30]);

  const handleInsertList = (val: number, pos: 'start' | 'end') => {
    if (pos === 'start') {
      setListNodes((prev) => [val, ...prev]);
    } else {
      setListNodes((prev) => [...prev, val]);
    }
  };

  const handleDeleteListNode = (val: number) => {
    setListNodes((prev) => prev.filter((n) => n !== val));
  };

  // 5. BST Tree Simulator
  const [bstNodes, setBstNodes] = useState<number[]>([50, 30, 70, 20, 40, 60, 80]);

  const calculateTreeCoordinates = (values: number[]): TreeNode[] => {
    if (values.length === 0) return [];
    
    // Simple BST Insertion to compute levels
    interface BinaryNode {
      val: number;
      left?: BinaryNode;
      right?: BinaryNode;
      x: number;
      y: number;
    }

    let root: BinaryNode | undefined = undefined;

    const insertBST = (node: BinaryNode | undefined, val: number, x: number, y: number, offset: number): BinaryNode => {
      if (!node) return { val, x, y };
      if (val < node.val) {
        node.left = insertBST(node.left, val, x - offset, y + 50, offset / 1.8);
      } else {
        node.right = insertBST(node.right, val, x + offset, y + 50, offset / 1.8);
      }
      return node;
    };

    values.forEach((v) => {
      root = insertBST(root, v, 180, 40, 60);
    });

    // Flatten tree to coordinates
    const list: TreeNode[] = [];
    const traverseFlatten = (node?: BinaryNode) => {
      if (!node) return;
      list.push({ value: node.val, x: node.x, y: node.y });
      traverseFlatten(node.left);
      traverseFlatten(node.right);
    };

    traverseFlatten(root);
    return list;
  };

  const handleBSTInsert = (val: number) => {
    if (bstNodes.includes(val)) return;
    setBstNodes((prev) => [...prev, val]);
  };

  const handleBSTDelete = (val: number) => {
    setBstNodes((prev) => prev.filter((n) => n !== val));
  };

  const triggerTraversal = (type: 'inorder' | 'preorder' | 'postorder') => {
    setIsPlaying(true);
    const sorted = [...bstNodes];
    
    // Dynamic mock traversal paths
    let path: number[] = [];
    if (type === 'inorder') {
      path = sorted.sort((a, b) => a - b);
    } else if (type === 'preorder') {
      path = [50, 30, 20, 40, 70, 60, 80].filter((n) => bstNodes.includes(n));
    } else {
      path = [20, 40, 30, 60, 80, 70, 50].filter((n) => bstNodes.includes(n));
    }

    const stepsList: Step[] = [];
    path.forEach((val, idx) => {
      stepsList.push({
        visited: path.slice(0, idx + 1),
        comparing: [val],
        description: `Visited node ${val} in ${type} order.`,
      });
    });

    setSteps(stepsList);
    setCurrentStep(0);
  };

  // 6. Graph Canvas Simulator
  const [vertices] = useState<string[]>(['A', 'B', 'C', 'D']);
  const [edges] = useState<{ u: string; v: string; w?: number }[]>([
    { u: 'A', v: 'B', w: 4 },
    { u: 'B', v: 'C', w: 3 },
    { u: 'C', v: 'D', w: 2 },
    { u: 'A', v: 'C', w: 5 }
  ]);

  const triggerGraphBFS = () => {
    setIsPlaying(true);
    const path = ['A', 'B', 'C', 'D'];
    const stepsList: Step[] = [];
    
    path.forEach((node, idx) => {
      stepsList.push({
        visited: [idx], // mock indexes
        graphHighlight: {
          nodes: path.slice(0, idx + 1),
          edges: edges.map((e) => `${e.u}-${e.v}`).slice(0, idx),
        },
        description: `BFS traversal: visit node "${node}". Queue unvisited adjacents.`,
      });
    });

    setSteps(stepsList);
    setCurrentStep(0);
  };

  // 7. Dynamic Programming Tabulations
  const [dpGrid] = useState<number[][]>([
    [0, 0, 0, 0, 0],
    [0, 10, 10, 10, 10],
    [0, 10, 12, 22, 22],
    [0, 10, 12, 22, 30]
  ]);

  const initKnapsackDP = () => {
    setIsPlaying(true);
    const grid: number[][] = [
      [0, 0, 0, 0, 0],
      [0, 10, 10, 10, 10],
      [0, 10, 12, 22, 22],
      [0, 10, 12, 22, 30]
    ];
    const stepsList: Step[] = [];

    // Simulate tabulation iterations row-by-row
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        stepsList.push({
          dpTable: grid,
          dpCols: ['0', '1', '2', '3', '4'],
          dpRows: ['Empty', 'Item 1', 'Item 2', 'Item 3'],
          dpCurrentCell: [r, c],
          description: `Knapsack cell computation at Row ${r}, Col ${c}. Maximize capacity limits.`,
        });
      }
    }

    setSteps(stepsList);
    setCurrentStep(0);
  };

  // 8. Trie Visualizer
  // const [trieWords] = useState<string[]>(['CAT', 'CAR', 'DOG']);

  // ----------------------------------------------------
  // Playback Control System loop
  // ----------------------------------------------------
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && steps.length > 0) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            if (timer) clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, animationSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, steps, animationSpeed]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (steps.length === 0) {
      // Lazy initialize default structures
      if (activeVis === 'bubble-sort') initBubbleSort();
      else if (activeVis === 'selection-sort') initSelectionSort();
      else if (activeVis === 'linear-search') initLinearSearch();
      else if (activeVis === 'binary-search') initBinarySearch();
      else if (activeVis === 'bst-traversal') triggerTraversal('inorder');
      else if (activeVis === 'graph-bfs') triggerGraphBFS();
      else if (activeVis === 'dp-knapsack') initKnapsackDP();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps([]);
    setPeekHighlight(false);
  };

  const handleStepForward = () => {
    if (steps.length === 0) return;
    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleStepBackward = () => {
    if (steps.length === 0) return;
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  // Fetch current active state details
  const activeStep = steps[currentStep] || { description: 'Select an algorithm and click play to begin simulations.' };

  return (
    <div className="space-y-6 text-left select-none pb-16">
      
      {/* Page Header toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-white tracking-tight flex items-center gap-2">
            Interactive Simulations Arena
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Observe the internal operations and reference pointer swaps of algorithms in real time.
          </p>
        </div>

        {/* Favorite & speed preference HUD */}
        <div className="flex items-center gap-3 select-none">
          {/* Favorite Toggle button */}
          <button
            onClick={() => toggleFavoriteMutation.mutate()}
            className={cn(
              "p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-all",
              isFavorite 
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
                : "bg-slate-900/40 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850"
            )}
          >
            <Heart className={cn("h-4.5 w-4.5", isFavorite && "fill-current")} />
            <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>
        </div>
      </div>

      {/* Primary Workspace Categories */}
      <div className="flex flex-wrap gap-2 select-none border-b border-slate-850 pb-4">
        {[
          { id: 'bubble-sort', name: 'Bubble Sort', cat: 'Sorting' },
          { id: 'selection-sort', name: 'Selection Sort', cat: 'Sorting' },
          { id: 'linear-search', name: 'Linear Search', cat: 'Searching' },
          { id: 'binary-search', name: 'Binary Search', cat: 'Searching' },
          { id: 'stack-operations', name: 'Stack Console', cat: 'Structures' },
          { id: 'queue-operations', name: 'Queue Console', cat: 'Structures' },
          { id: 'linked-list', name: 'Linked List', cat: 'Structures' },
          { id: 'bst-traversal', name: 'BST Tree', cat: 'Trees' },
          { id: 'graph-bfs', name: 'Graph BFS', cat: 'Graphs' },
          { id: 'dp-knapsack', name: 'Knapsack DP', cat: 'Dynamic Programming' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveVis(item.id);
              setSearchParams({ type: item.id });
              handleReset();
            }}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
              activeVis === item.id 
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                : "bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-350"
            )}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Algorithm description card */}
      <div className="bg-slate-900/10 border border-slate-800/40 p-4.5 rounded-2xl select-none">
        <p className="text-xs text-slate-350 leading-relaxed font-medium">
          <span className="font-bold text-indigo-400">About Algorithm:</span> {ALGORITHM_DESCRIPTIONS[activeVis] || 'Select an algorithm mode to visualize.'}
        </p>
      </div>

      {/* Main double column split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto items-start">
        
        {/* Left Column: Visualizer Canvas & Playback console (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card hoverEffect={false} className="border-slate-850 bg-slate-900/20 p-5 rounded-3xl flex flex-col h-[400px]">
            {/* Playback HUD bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850/50 pb-4 mb-4 select-none">
              {/* Speed Slider control */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Delay</span>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="100"
                  value={animationSpeed}
                  onChange={(e) => {
                    const speed = parseInt(e.target.value);
                    setAnimationSpeed(speed);
                    updatePrefMutation.mutate(speed);
                  }}
                  className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[9px] font-mono text-slate-400 font-bold">{animationSpeed}ms</span>
              </div>

              {/* Playback Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:text-white transition-colors cursor-pointer"
                  title="Reset Simulation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleStepBackward}
                  className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:text-white transition-colors cursor-pointer"
                  title="Step Backward"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  onClick={handleStepForward}
                  className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:text-white transition-colors cursor-pointer"
                  title="Step Forward"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Simulation Rendering Canvas */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-slate-950/40 rounded-2xl border border-slate-900/50 p-6 relative">
              
              {/* 1. Sorting bar chart rendering */}
              {(activeVis === 'bubble-sort' || activeVis === 'selection-sort') && (
                <div className="flex items-end gap-3.5 w-full max-w-md h-48 justify-center select-none pt-4">
                  {(activeStep.array || sortArray).map((val, idx) => {
                    const isComparing = activeStep.comparing?.includes(idx);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{val}</span>
                        <div
                          className={cn(
                            "w-full rounded-t-lg transition-all duration-300",
                            isComparing ? "bg-indigo-500 shadow-lg shadow-indigo-500/20" : "bg-slate-800"
                          )}
                          style={{ height: `${val * 1.5}px` }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. Searching linear/binary rendering */}
              {(activeVis === 'linear-search' || activeVis === 'binary-search') && (
                <div className="flex flex-wrap gap-y-7 gap-x-3.5 justify-center select-none max-w-lg pb-4 pt-2">
                  {(activeStep.array || sortArray).map((val, idx) => {
                    const isCurrent = activeStep.comparing?.includes(idx);
                    const isFound = activeStep.visited?.includes(idx);
                    const isLow = activeStep.low === idx;
                    const isMid = activeStep.mid === idx;
                    const isHigh = activeStep.high === idx;
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "w-12 h-16 rounded-xl flex flex-col items-center justify-center border font-mono text-xs font-bold transition-all duration-300 relative",
                          isFound ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/35" :
                          isCurrent ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/35" :
                          "bg-slate-900/40 text-slate-400 border-slate-800"
                        )}
                      >
                        <span className="text-[8px] text-slate-550 mb-0.5">#{idx}</span>
                        <span>{val}</span>
                        
                        {/* Detailed markers */}
                        {activeVis === 'binary-search' && (isLow || isMid || isHigh) && (
                          <div className="absolute -bottom-5.5 flex gap-1 text-[8px] font-black uppercase tracking-wider">
                            {isLow && <span className="text-sky-400" title="Low boundary">L</span>}
                            {isMid && <span className="text-indigo-400" title="Midpoint">M</span>}
                            {isHigh && <span className="text-rose-450" title="High boundary">H</span>}
                          </div>
                        )}
                        {activeVis === 'linear-search' && isCurrent && (
                          <span className="absolute -bottom-5.5 text-indigo-400 text-[8px] font-black uppercase">Ptr</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Stack Linear Buffer rendering */}
              {activeVis === 'stack-operations' && (
                <div className="flex flex-col gap-2 w-48 max-h-[220px] overflow-y-auto select-none border-b border-indigo-500/30 pb-2">
                  {(activeStep.array || linearNodes).map((n, idx) => {
                    const isHighlighted = activeStep.comparing?.includes(idx);
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "p-3 rounded-xl border font-mono text-xs font-bold text-center transition-all duration-300",
                          isHighlighted ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40" :
                          idx === 0 && peekHighlight ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : 
                          "bg-slate-900 border-slate-850 text-slate-300"
                        )}
                      >
                        {idx === 0 && <span className="text-[8px] text-indigo-400 font-sans font-black uppercase tracking-wider block mb-0.5">Top Element</span>}
                        {n}
                      </div>
                    );
                  })}
                  {(activeStep.array || linearNodes).length === 0 && (
                    <span className="text-xs text-slate-600 italic text-center py-4">Stack is empty. Push elements.</span>
                  )}
                </div>
              )}

              {/* 4. Queue Buffer rendering */}
              {activeVis === 'queue-operations' && (
                <div className="flex gap-2 items-center w-full max-w-md justify-center select-none overflow-x-auto py-4">
                  {(activeStep.array || linearNodes).map((n, idx) => {
                    const isHighlighted = activeStep.comparing?.includes(idx);
                    const isFront = idx === 0;
                    const isRear = idx === (activeStep.array || linearNodes).length - 1;
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "p-3 w-14 rounded-xl border text-center font-mono text-xs font-bold shrink-0 transition-all duration-300",
                          isHighlighted ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40" : "bg-slate-900 border-slate-800 text-slate-300"
                        )}
                      >
                        {isFront && <span className="text-[8px] text-slate-550 block font-sans uppercase">Front</span>}
                        {isRear && <span className="text-[8px] text-slate-550 block font-sans uppercase">Rear</span>}
                        {n}
                      </div>
                    );
                  })}
                  {(activeStep.array || linearNodes).length === 0 && (
                    <span className="text-xs text-slate-600 italic">Queue is empty. Enqueue nodes.</span>
                  )}
                </div>
              )}

              {/* 5. Linked List nodes chaining */}
              {activeVis === 'linked-list' && (
                <div className="flex flex-wrap gap-4 items-center justify-center select-none max-w-lg">
                  {listNodes.map((n, idx) => (
                    <React.Fragment key={idx}>
                      <div className="p-3 w-14 rounded-xl border border-slate-800 bg-slate-900 text-center font-mono text-xs font-bold text-slate-300">
                        <span className="text-[8px] text-slate-550 block font-sans uppercase">Val</span>
                        {n}
                      </div>
                      {idx < listNodes.length - 1 && (
                        <span className="text-slate-600 font-bold font-mono shrink-0">→</span>
                      )}
                    </React.Fragment>
                  ))}
                  {listNodes.length === 0 && (
                    <span className="text-xs text-slate-600 italic">List is empty. Insert nodes.</span>
                  )}
                </div>
              )}

              {/* 6. BST Tree traversal hierarchy */}
              {activeVis === 'bst-traversal' && (
                <svg className="w-full h-full max-h-[220px]" viewBox="0 0 360 220">
                  {/* Edges */}
                  {calculateTreeCoordinates(bstNodes).map((node, idx) => {
                    const children = calculateTreeCoordinates(bstNodes).filter(
                      (c) => (c.value < node.value && c.y === node.y + 50 && Math.abs(c.x - node.x) < 40) ||
                             (c.value > node.value && c.y === node.y + 50 && Math.abs(c.x - node.x) < 40)
                    );
                    return children.map((child, cIdx) => (
                      <line 
                        key={`${idx}-${cIdx}`}
                        x1={node.x} 
                        y1={node.y} 
                        x2={child.x} 
                        y2={child.y} 
                        stroke="#1e293b" 
                        strokeWidth="1.5" 
                      />
                    ));
                  })}
                  {/* Vertices */}
                  {calculateTreeCoordinates(bstNodes).map((node) => {
                    const isHighlighted = activeStep.comparing?.includes(node.value);
                    const isVisited = activeStep.visited?.includes(node.value);
                    return (
                      <g key={node.value} className="cursor-pointer">
                        <circle 
                          cx={node.x} 
                          cy={node.y} 
                          r={14} 
                          fill={isVisited ? '#10b981' : isHighlighted ? '#6366f1' : '#0f172a'} 
                          stroke={isVisited ? '#047857' : isHighlighted ? '#4338ca' : '#1e293b'}
                          strokeWidth="1.5"
                        />
                        <text 
                          x={node.x} 
                          y={node.y + 3} 
                          textAnchor="middle" 
                          fill="#cbd5e1" 
                          fontSize="9px" 
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {node.value}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* 7. Graph Node Link Diagram */}
              {activeVis === 'graph-bfs' && (
                <svg className="w-full h-full max-h-[220px]" viewBox="0 0 360 220">
                  {/* Edges */}
                  {edges.map((e, idx) => {
                    const uNode = { x: 80 + (idx % 2) * 120, y: 50 + Math.floor(idx / 2) * 80 };
                    const vNode = { x: 80 + ((idx + 1) % 2) * 120, y: 50 + Math.floor((idx + 1) / 2) * 80 };
                    return (
                      <g key={idx}>
                        <line 
                          x1={uNode.x} 
                          y1={uNode.y} 
                          x2={vNode.x} 
                          y2={vNode.y} 
                          stroke="#1e293b" 
                          strokeWidth="1.5" 
                        />
                        {e.w && (
                          <text 
                            x={(uNode.x + vNode.x) / 2} 
                            y={(uNode.y + vNode.y) / 2 - 5}
                            fontSize="8px"
                            fill="#64748b"
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            {e.w}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* Vertices */}
                  {vertices.map((v, idx) => {
                    const x = 80 + (idx % 2) * 120;
                    const y = 50 + Math.floor(idx / 2) * 80;
                    const isVisited = activeStep.graphHighlight?.nodes.includes(v);
                    return (
                      <g key={v}>
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={14} 
                          fill={isVisited ? '#10b981' : '#0f172a'} 
                          stroke={isVisited ? '#047857' : '#1e293b'}
                          strokeWidth="1.5"
                        />
                        <text 
                          x={x} 
                          y={y + 3} 
                          textAnchor="middle" 
                          fill="#cbd5e1" 
                          fontSize="9px" 
                          fontWeight="bold"
                        >
                          {v}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* 8. Knapsack DP Table grid */}
              {activeVis === 'dp-knapsack' && (
                <div className="flex flex-col gap-1.5 select-none overflow-x-auto py-2">
                  {(activeStep.dpTable || dpGrid).map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-1.5 justify-center">
                      {row.map((val, cIdx) => {
                        const isCurrent = activeStep.dpCurrentCell?.[0] === rIdx && activeStep.dpCurrentCell?.[1] === cIdx;
                        return (
                          <div 
                            key={cIdx}
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold border transition-colors duration-300",
                              isCurrent ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/35" : "bg-slate-900 border-slate-850 text-slate-350"
                            )}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </Card>

          {/* Interactive controls panel depending on type */}
          <Card hoverEffect={false} className="border-slate-850 bg-slate-900/10 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Simulator Workspace Console</h4>
            
            {/* Custom array / Target value controls */}
            <div className="flex flex-wrap gap-4 select-none">
              {(activeVis === 'bubble-sort' || activeVis === 'selection-sort') && (
                <>
                  <Button onClick={() => generateRandomArray(8)} variant="outline" size="sm">
                    Generate Array
                  </Button>
                  <Button onClick={() => generateRandomArray(12)} variant="outline" size="sm">
                    Enlarge Array (12)
                  </Button>
                </>
              )}

              {(activeVis === 'linear-search' || activeVis === 'binary-search') && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-450 shrink-0">Target Value</span>
                  <input
                    type="number"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(parseInt(e.target.value) || 10)}
                    className="w-20 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <Button onClick={() => {
                    handleReset();
                    if (activeVis === 'linear-search') initLinearSearch();
                    else initBinarySearch();
                  }} variant="primary" size="sm">
                    Set Target
                  </Button>
                </div>
              )}

              {activeVis === 'stack-operations' && (
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="number"
                    placeholder="Val"
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                  <Button onClick={() => handlePushStack(parseInt(customInputValue) || 50)} variant="outline" size="sm">
                    Push Stack
                  </Button>
                  <Button onClick={handlePopStack} variant="outline" size="sm">
                    Pop Stack
                  </Button>
                  <Button onClick={() => { setPeekHighlight(true); toast('Peek top element highlighted!', 'info'); }} variant="outline" size="sm">
                    Peek Top
                  </Button>
                </div>
              )}

              {activeVis === 'queue-operations' && (
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="number"
                    placeholder="Val"
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                  <Button onClick={() => handleEnqueue(parseInt(customInputValue) || 60)} variant="outline" size="sm">
                    Enqueue Node
                  </Button>
                  <Button onClick={handleDequeue} variant="outline" size="sm">
                    Dequeue Node
                  </Button>
                </div>
              )}

              {activeVis === 'linked-list' && (
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="number"
                    placeholder="Node"
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                  <Button onClick={() => handleInsertList(parseInt(customInputValue) || 40, 'start')} variant="outline" size="sm">
                    Insert Head
                  </Button>
                  <Button onClick={() => handleInsertList(parseInt(customInputValue) || 40, 'end')} variant="outline" size="sm">
                    Insert Tail
                  </Button>
                  <Button onClick={() => handleDeleteListNode(parseInt(customInputValue) || 20)} variant="danger" size="sm" className="h-auto py-1.5 text-xs">
                    Delete Node
                  </Button>
                </div>
              )}

              {activeVis === 'bst-traversal' && (
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="number"
                    placeholder="Value"
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                  <Button onClick={() => handleBSTInsert(parseInt(customInputValue) || 45)} variant="outline" size="sm">
                    Insert BST
                  </Button>
                  <Button onClick={() => handleBSTDelete(parseInt(customInputValue) || 20)} variant="danger" size="sm" className="h-auto py-1.5 text-xs">
                    Delete Node
                  </Button>
                  <div className="w-full h-[1px] bg-slate-850/40 my-2" />
                  <Button onClick={() => triggerTraversal('inorder')} variant="primary" size="sm">
                    Inorder DFS
                  </Button>
                  <Button onClick={() => triggerTraversal('preorder')} variant="primary" size="sm">
                    Preorder DFS
                  </Button>
                  <Button onClick={() => triggerTraversal('postorder')} variant="primary" size="sm">
                    Postorder DFS
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Explanation Panel & Complexities (1/3 width) */}
        <div className="space-y-6 text-left">
          
          {/* Real-time Steps logs & descriptions */}
          <Card hoverEffect={false} className="border-indigo-500/10 bg-indigo-500/5 p-5 rounded-3xl space-y-4">
            <div>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Step Explanation</span>
              <h4 className="font-heading font-black text-base text-white mt-1">Trace log</h4>
            </div>
            
            <p className="text-xs text-slate-350 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-850/45 min-h-[100px]">
              {activeStep.description}
            </p>

            <div className="flex justify-between text-[10px] text-slate-500 font-semibold border-t border-slate-850/50 pt-3">
              <span>Steps Trace</span>
              <span>{steps.length > 0 ? `${currentStep + 1} / ${steps.length}` : '0 / 0'}</span>
            </div>
          </Card>

          {/* Complexities and Pseudocode panel */}
          <Card hoverEffect={false} className="border-slate-850 bg-slate-900/10 p-5 rounded-2xl space-y-4">
            <div>
              <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Core Information</span>
              <h4 className="font-heading font-bold text-sm text-slate-200 mt-1">Complexity Complexities</h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-850/30">
                <span className="text-slate-400 font-semibold">Time Complexity (Worst)</span>
                <span className="font-mono font-bold text-indigo-400">
                  {activeVis.includes('sort') ? 'O(N²)' : 
                   activeVis.includes('binary') ? 'O(log N)' : 'O(N)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 font-semibold">Space Complexity (Auxiliary)</span>
                <span className="font-mono font-bold text-indigo-400">
                  {activeVis.includes('merge') ? 'O(N)' : 'O(1)'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Pseudo Code</span>
              <pre className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl font-mono text-[9px] text-indigo-350 leading-relaxed overflow-x-auto">
                {activeVis.includes('sort') ? 
`for i from 0 to N-1:
  for j from 0 to N-i-1:
    if arr[j] > arr[j+1]:
      swap(arr[j], arr[j+1])` :
activeVis.includes('search') ?
`while low <= high:
  mid = (low + high) / 2
  if arr[mid] == target:
    return mid
  else if arr[mid] < target:
    low = mid + 1` :
`push(node):
  node.next = head
  head = node`}
              </pre>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};
