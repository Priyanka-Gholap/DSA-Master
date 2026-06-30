import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const topicsData = [
  {
    title: 'Introduction to DSA',
    slug: 'intro-to-dsa',
    description: 'Understand the foundations of Data Structures & Algorithms, and why they are critical for building efficient software.',
    difficulty: 'Beginner',
    estimatedTime: '30 mins',
    category: 'Basics',
    order: 1,
    content: {
      learningObjectives: ['Define DSA', 'Learn memory basics', 'Understand complexity'],
      prerequisites: [],
      realWorldApplications: ['OS routing tables', 'Database caching buffers'],
      introduction: 'Introduction to DSA basics...',
      whyLearn: 'Why learn DSA...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Read Address', best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' }]
    }
  },
  {
    title: 'Java Basics for DSA',
    slug: 'java-basics-dsa',
    description: 'Get familiar with core Java language features required for DSA, including references, memory allocation, and classes.',
    difficulty: 'Beginner',
    estimatedTime: '45 mins',
    category: 'Basics',
    order: 2,
    content: {
      learningObjectives: ['Memory allocation', 'Reference models', 'Arrays syntax'],
      prerequisites: ['intro-to-dsa'],
      realWorldApplications: ['Custom data structures', 'Heap objects representation'],
      introduction: 'Understanding references and objects...',
      whyLearn: 'Prerequisites for Linked lists and Trees...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Reference Lookup', best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' }]
    }
  },
  {
    title: 'Time & Space Complexity',
    slug: 'time-space-complexity',
    description: 'Learn Big-O notation to analyze algorithms, measure execution speed, and calculate memory footprints.',
    difficulty: 'Beginner',
    estimatedTime: '1 hour',
    category: 'Basics',
    order: 3,
    content: {
      learningObjectives: ['Learn Big-O', 'Analyze loop runtimes', 'Compute auxiliary space'],
      prerequisites: ['java-basics-dsa'],
      realWorldApplications: ['API performance analysis'],
      introduction: 'Measuring algorithm efficiencies...',
      whyLearn: 'Avoid building slow and unscalable software...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Operation scan', best: 'O(1)', average: 'O(N)', worst: 'O(N)', space: 'O(1)' }]
    }
  },
  {
    title: 'Arrays',
    slug: 'arrays',
    description: 'Master arrays: the simplest linear structure. Learn memory contiguity, indexing, insertions, deletions, and standard algorithms.',
    difficulty: 'Beginner',
    estimatedTime: '1.5 hours',
    category: 'Data Structures',
    order: 4,
    content: {
      learningObjectives: ['Contiguous blocks', 'O(1) access', 'Boundary elements'],
      prerequisites: ['time-space-complexity'],
      realWorldApplications: ['Tables', 'Matrix operations', 'Dynamic arrays buffers'],
      introduction: 'Linear contiguous memory...',
      whyLearn: 'Building blocks for lists and heaps...',
      keyConcepts: [],
      timeComplexity: [
        { operation: 'Access by Index', best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
        { operation: 'Linear Search', best: 'O(1)', average: 'O(N)', worst: 'O(N)', space: 'O(1)' }
      ]
    }
  },
  {
    title: 'Strings',
    slug: 'strings',
    description: 'Understand Java String immutable pools, builder classes, manipulations, and basic pattern searching algorithms.',
    difficulty: 'Beginner',
    estimatedTime: '1.5 hours',
    category: 'Data Structures',
    order: 5,
    content: {
      learningObjectives: ['String pool', 'StringBuilder API', 'Pattern comparisons'],
      prerequisites: ['arrays'],
      realWorldApplications: ['Parsing text', 'Compilers'],
      introduction: 'Character arrays...',
      whyLearn: 'Frequently asked coding questions...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Concat', best: 'O(N)', average: 'O(N)', worst: 'O(N)', space: 'O(N)' }]
    }
  },
  {
    title: 'Recursion',
    slug: 'recursion',
    description: 'Learn recursion: the technique of solving problems by breaking them down into smaller subproblems solved by the same function.',
    difficulty: 'Intermediate',
    estimatedTime: '2 hours',
    category: 'Algorithms',
    order: 6,
    content: {
      learningObjectives: ['Base case', 'Call stacks', 'Divide and conquer'],
      prerequisites: ['time-space-complexity'],
      realWorldApplications: ['Directory traversal', 'Nested loops replacement'],
      introduction: 'Self-calling functions...',
      whyLearn: 'Foundation for Trees and Graphs...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Stack frame push', best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(N)' }]
    }
  },
  {
    title: 'Sorting Algorithms',
    slug: 'sorting-algorithms',
    description: 'Learn basic (Bubble, Insertion, Selection) and advanced (Merge, Quick) sorting algorithms, and compare their trade-offs.',
    difficulty: 'Intermediate',
    estimatedTime: '2.5 hours',
    category: 'Algorithms',
    order: 7,
    content: {
      learningObjectives: ['Quadratic sorts', 'O(N log N) sorts', 'Stability analysis'],
      prerequisites: ['arrays', 'recursion'],
      realWorldApplications: ['Data formatting'],
      introduction: 'Arranging collections...',
      whyLearn: 'Preprocessing data...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Quick Sort', best: 'O(N log N)', average: 'O(N log N)', worst: 'O(N²)', space: 'O(log N)' }]
    }
  },
  {
    title: 'Searching Algorithms',
    slug: 'searching-algorithms',
    description: 'Compare Linear Search and Binary Search. Understand linear scanning and sorted array bounds.',
    difficulty: 'Beginner',
    estimatedTime: '1 hour',
    category: 'Algorithms',
    order: 8,
    content: {
      learningObjectives: ['Linear scan', 'Sorted searches', 'Complexity lookup'],
      prerequisites: ['arrays'],
      realWorldApplications: ['Item search'],
      introduction: 'Locating elements...',
      whyLearn: 'Common operation...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Search scan', best: 'O(1)', average: 'O(N)', worst: 'O(N)', space: 'O(1)' }]
    }
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    description: 'Deep dive into Binary Search: boundary checks, midpoints, finding range limits, and searching on answer spaces.',
    difficulty: 'Intermediate',
    estimatedTime: '2 hours',
    category: 'Algorithms',
    order: 9,
    content: {
      learningObjectives: ['Boundaries', 'Monotonic check', 'Logarithmic bounds'],
      prerequisites: ['searching-algorithms'],
      realWorldApplications: ['Git bisect', 'Lookup bounds'],
      introduction: 'Divide search space in half...',
      whyLearn: 'Extreme performance optimization...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Binary Lookup', best: 'O(1)', average: 'O(log N)', worst: 'O(log N)', space: 'O(1)' }]
    }
  },
  {
    title: 'Linked List',
    slug: 'linked-list',
    description: 'Understand singly, doubly, and circular linked lists. Master node references, pointer swaps, and reversals.',
    difficulty: 'Intermediate',
    estimatedTime: '2 hours',
    category: 'Data Structures',
    order: 10,
    content: {
      learningObjectives: ['Nodes references', 'Head/Tail insert', 'Pointer reversals'],
      prerequisites: ['java-basics-dsa'],
      realWorldApplications: ['Browser back/forward history', 'Lru cache structures'],
      introduction: 'Non-contiguous node chains...',
      whyLearn: 'Learn pointer manipulations...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Access Element', best: 'O(1)', average: 'O(N)', worst: 'O(N)', space: 'O(1)' }]
    }
  },
  {
    title: 'Stack',
    slug: 'stack',
    description: 'Learn LIFO (Last In First Out) stacks. Implement using arrays and nodes, and solve parentheses matching.',
    difficulty: 'Beginner',
    estimatedTime: '1.5 hours',
    category: 'Data Structures',
    order: 11,
    content: {
      learningObjectives: ['LIFO rules', 'Array implementation', 'Expression evaluation'],
      prerequisites: ['arrays', 'linked-list'],
      realWorldApplications: ['Backtracking history', 'JVM call stack'],
      introduction: 'Last in First out linear buffer...',
      whyLearn: 'DFS searches helper...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Push element', best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' }]
    }
  },
  {
    title: 'Queue',
    slug: 'queue',
    description: 'Learn FIFO (First In First Out) queues. Understand circular queues and double-ended queues (Deques).',
    difficulty: 'Beginner',
    estimatedTime: '1.5 hours',
    category: 'Data Structures',
    order: 12,
    content: {
      learningObjectives: ['FIFO rules', 'Circular buffer index', 'Array queue shifts'],
      prerequisites: ['arrays', 'linked-list'],
      realWorldApplications: ['CPU task scheduling', 'Web servers messaging brokers'],
      introduction: 'First in First out buffer...',
      whyLearn: 'BFS traversals helper...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Enqueue', best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' }]
    }
  },
  {
    title: 'Hashing',
    slug: 'hashing',
    description: 'Learn Hash Tables, hash functions, and collision resolution techniques (chaining vs open addressing).',
    difficulty: 'Intermediate',
    estimatedTime: '2 hours',
    category: 'Data Structures',
    order: 13,
    content: {
      learningObjectives: ['Hash functions', 'Collision resolutions', 'O(1) maps lookup'],
      prerequisites: ['arrays', 'linked-list'],
      realWorldApplications: ['Caching engines', 'Database unique keys index'],
      introduction: 'Hash code calculations...',
      whyLearn: 'Constant time lookup operations...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Map Search', best: 'O(1)', average: 'O(1)', worst: 'O(N)', space: 'O(N)' }]
    }
  },
  {
    title: 'Trees',
    slug: 'trees',
    description: 'Master binary trees: hierarchy structures, child pointers, and traversals (Inorder, Preorder, Postorder, Levelorder).',
    difficulty: 'Advanced',
    estimatedTime: '3 hours',
    category: 'Data Structures',
    order: 14,
    content: {
      learningObjectives: ['Child node links', 'DFS traversals list', 'BFS queue levelorder'],
      prerequisites: ['recursion', 'queue', 'stack'],
      realWorldApplications: ['HTML DOM', 'JSON parsers'],
      introduction: 'Non-linear hierarchical data...',
      whyLearn: 'Foundational data structures for BST and Heaps...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Depth traverse', best: 'O(N)', average: 'O(N)', worst: 'O(N)', space: 'O(H)' }]
    }
  },
  {
    title: 'Binary Search Tree',
    slug: 'binary-search-tree',
    description: 'Understand BST rules: left is smaller, right is larger. Master BST search, insertion, and deletion.',
    difficulty: 'Advanced',
    estimatedTime: '2.5 hours',
    category: 'Data Structures',
    order: 15,
    content: {
      learningObjectives: ['BST Property', 'Successor deletes', 'Height bounds'],
      prerequisites: ['trees'],
      realWorldApplications: ['Sorted maps implementation'],
      introduction: 'Ordered binary trees...',
      whyLearn: 'Logarithmic search time...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Insert Node', best: 'O(log N)', average: 'O(log N)', worst: 'O(N)', space: 'O(H)' }]
    }
  },
  {
    title: 'Heap',
    slug: 'heap',
    description: 'Master binary heaps (Min-Heap / Max-Heap). Learn heapify up/down algorithms and PriorityQueue queues.',
    difficulty: 'Advanced',
    estimatedTime: '2.5 hours',
    category: 'Data Structures',
    order: 16,
    content: {
      learningObjectives: ['Heap tree property', 'Heapify index arithmetic', 'PriorityQueue scheduling'],
      prerequisites: ['arrays', 'trees'],
      realWorldApplications: ['Dijkstra queue optimizer', 'Stream priority filtering'],
      introduction: 'Complete binary priority trees...',
      whyLearn: 'O(1) min/max element lookup...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Heapify Down', best: 'O(1)', average: 'O(log N)', worst: 'O(log N)', space: 'O(1)' }]
    }
  },
  {
    title: 'Graphs',
    slug: 'graphs',
    description: 'Master Graph representations (Adjacency Matrix/List) and traversal algorithms: Depth First Search (DFS) & Breadth First Search (BFS).',
    difficulty: 'Advanced',
    estimatedTime: '4 hours',
    category: 'Data Structures',
    order: 17,
    content: {
      learningObjectives: ['Adjacency grids', 'DFS recursion', 'BFS queues'],
      prerequisites: ['trees', 'queue', 'stack'],
      realWorldApplications: ['GPS navigation', 'Social networks connection'],
      introduction: 'Vertices and edges networks...',
      whyLearn: 'Graph network paths solvers...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Path Traverse', best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)' }]
    }
  },
  {
    title: 'Greedy Algorithms',
    slug: 'greedy-algorithms',
    description: 'Understand the Greedy choice property. Solve optimization problems by choosing local optimums.',
    difficulty: 'Intermediate',
    estimatedTime: '2 hours',
    category: 'Algorithms',
    order: 18,
    content: {
      learningObjectives: ['Local choices optimization', 'Activity schedules', 'Knapsack fractions'],
      prerequisites: ['sorting-algorithms'],
      realWorldApplications: ['Huffman compression', 'Currency change exchange'],
      introduction: 'Local optimization decisions...',
      whyLearn: 'Fast executions...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Sort elements', best: 'O(N log N)', average: 'O(N log N)', worst: 'O(N log N)', space: 'O(1)' }]
    }
  },
  {
    title: 'Dynamic Programming',
    slug: 'dynamic-programming',
    description: 'Master Dynamic Programming: Overlapping subproblems, Memoization (top-down), and Tabulation (bottom-up).',
    difficulty: 'Advanced',
    estimatedTime: '5 hours',
    category: 'Algorithms',
    order: 19,
    content: {
      learningObjectives: ['Memoization maps', 'Tabulation matrices', 'Subproblem allocations'],
      prerequisites: ['recursion', 'time-space-complexity'],
      realWorldApplications: ['Regex parsing', 'Lcs comparison utilities'],
      introduction: 'Solving overlapping substructures...',
      whyLearn: 'Drastically reduce exponential time to polynomial time...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Tabulated search', best: 'O(N*M)', average: 'O(N*M)', worst: 'O(N*M)', space: 'O(N*M)' }]
    }
  },
  {
    title: 'Trie',
    slug: 'trie',
    description: 'Master Prefix Trees (Tries). Learn prefix matching, insert search characters, and search auto-completes.',
    difficulty: 'Advanced',
    estimatedTime: '2.5 hours',
    category: 'Data Structures',
    order: 20,
    content: {
      learningObjectives: ['Character node link mappings', 'Prefix search autocompletes', 'Insertion string operations'],
      prerequisites: ['trees', 'hashing'],
      realWorldApplications: ['Autocompletes search engines', 'Dictionary spelling corrections'],
      introduction: 'Prefix character tree lists...',
      whyLearn: 'Lookup string keys in O(Length) time...',
      keyConcepts: [],
      timeComplexity: [{ operation: 'Trie Search', best: 'O(L)', average: 'O(L)', worst: 'O(L)', space: 'O(Words * L)' }]
    }
  }
];

function generateLesson(topic: any, topicId: string, prevSlug: string | null) {
  const isArrays = topic.slug === 'arrays';
  const isLL = topic.slug === 'linked-list';

  const objectives = [
    'Understand conceptual definitions and core behaviors of ' + topic.title,
    'Learn memory allocation and pointer references inside Java JVM heap',
    'Examine average and worst-case time complexities of major operations',
    'Recognize common programming mistakes like boundaries or null pointers',
    'Evaluate real-world engineering use cases where ' + topic.title + ' is chosen'
  ];

  const prerequisites = prevSlug ? [prevSlug] : [];

  let theory = [
    { type: 'heading', text: 'Core Theory of ' + topic.title, level: 3 },
    { type: 'paragraph', text: 'Every program is composed of data and logic. To handle data, we use structures specifically structured to hold information. ' + topic.title + ' represents a key framework in computer science.' },
    { type: 'tip', text: 'Pro Tip: When selecting structures in Java, always think about the frequency of read operations vs write/modification operations. This decides whether linear memory or reference lists are best.' }
  ];

  if (isArrays) {
    theory = [
      { type: 'heading', text: '1. What is an Array?', level: 3 },
      { type: 'paragraph', text: 'An array is a data structure consisting of a collection of elements, each identified by at least one array index. In Java, arrays are objects stored on the Heap. They occupy a contiguous block of memory, meaning elements are located next to each other in RAM.' },
      { type: 'warning', text: 'Critical: Because arrays occupy contiguous memory, their size is fixed on creation. You cannot expand an array dynamically without creating a new block and copying elements over.' },
      { type: 'heading', text: '2. Contiguous Memory Access', level: 3 },
      { type: 'paragraph', text: 'Since elements reside back-to-back, the address of any element at index `i` is calculated instantly using: Address = BaseAddress + (Index * ElementSize). This arithmetic calculation allows constant-time O(1) random access.' }
    ];
  } else if (isLL) {
    theory = [
      { type: 'heading', text: '1. What is a Linked List?', level: 3 },
      { type: 'paragraph', text: 'A Linked List is a linear data structure where elements are not stored in contiguous locations. Instead, elements are stored in individual objects called Nodes. Each node contains a value and a pointer (reference) to the next node in the sequence.' },
      { type: 'tip', text: 'Linked lists allow dynamic insertions and deletions in constant O(1) time without shifting arrays, but they lose O(1) random index access.' }
    ];
  }

  let applications = [
    { title: 'Data caching', description: 'Storing recent data queries for quick retrieval.' },
    { title: 'Buffer operations', description: 'Asynchronous event listeners storage.' }
  ];

  if (isArrays) {
    applications = [
      { title: 'Image Processing', description: 'Storing pixel values in 2D grid coordinates arrays.' },
      { title: 'Database Index Buffers', description: 'Holding sequential rows of data block lookups.' },
      { title: 'Lookup Tables', description: 'Caching static reference tables for O(1) access.' }
    ];
  }

  let syntax = [
    {
      title: 'Declaration & Traversal',
      language: 'java',
      code: `// Custom Java representation for ${topic.title}\npublic class Demo {\n    public static void main(String[] args) {\n        System.out.println("Exploring ${topic.title}");\n    }\n}`
    }
  ];

  if (isArrays) {
    syntax = [
      {
        title: 'Static Array Syntax',
        language: 'java',
        code: `// Declare and allocate an array of size 5\nint[] arr = new int[5];\n\n// Inline initialization\nint[] numbers = {10, 20, 30, 40, 50};\n\n// Index assignment\narr[0] = 99;\nint val = arr[0]; // val is 99`
      },
      {
        title: 'Array Traversal',
        language: 'java',
        code: `// Standard for loop\nfor (int i = 0; i < numbers.length; i++) {\n    System.out.println("Element at " + i + ": " + numbers[i]);\n}\n\n// Enhanced for-each loop\nfor (int num : numbers) {\n    System.out.println("Val: " + num);\n}`
      }
    ];
  } else if (isLL) {
    syntax = [
      {
        title: 'Singly LinkedList Node Creation',
        language: 'java',
        code: `class ListNode {\n    int val;\n    ListNode next;\n\n    ListNode(int val) {\n        this.val = val;\n        this.next = null;\n    }\n}`
      }
    ];
  }

  let dryRun = {
    title: 'Iterative Sequence Trace',
    steps: [
      { index: '0', pointer: 'Start', value: 'Value mapping', comment: 'Initialize pointers at boundaries.' },
      { index: '1', pointer: 'Loop', value: 'Evaluate state', comment: 'Check loops condition. Advance index.' }
    ]
  };

  if (isArrays) {
    dryRun = {
      title: 'Array Reversal Walkthrough',
      steps: [
        { index: 'Low: 0, High: 4', pointer: 'Swap pointers', value: 'arr = {10, 20, 30, 40, 50}', comment: 'Swap arr[0] and arr[4]. Increment low, decrement high.' },
        { index: 'Low: 1, High: 3', pointer: 'Swap pointers', value: 'arr = {50, 20, 30, 40, 10}', comment: 'Swap arr[1] and arr[3]. Increment low, decrement high.' },
        { index: 'Low: 2, High: 2', pointer: 'Pointers meet', value: 'arr = {50, 40, 30, 20, 10}', comment: 'Low equals high. Loop terminates. Array successfully reversed.' }
      ]
    };
  }

  const complexity = topic.content.timeComplexity;

  let mistakes = [
    { title: 'Uninitialized References', description: 'Attempting to fetch property keys on variables before instantiation.' }
  ];

  if (isArrays) {
    mistakes = [
      { title: 'Index Out Of Bounds Exception', description: 'Accessing elements at index >= array.length or index < 0.' },
      { title: 'Forgetting Arrays size is Fixed', description: 'Attempting to add elements beyond allocation size without re-allocating.' },
      { title: 'Incorrect Loop termination condition', description: 'Using <= arr.length instead of < arr.length, triggering boundary errors.' }
    ];
  }

  const interviewTips = {
    questions: [
      'Describe differences between static and dynamic allocations.',
      'Explain spatial locality of memory caches.'
    ],
    companyTips: 'Frequently asked in initial screenings by Google, Amazon, and Microsoft to verify foundations.'
  };

  const summary = {
    takeaways: [
      'Foundations of DSA require active spatial memory awareness.',
      'Big-O profiles dictate whether solutions scale.'
    ],
    nextTopic: prevSlug || 'none'
  };

  return {
    topicId,
    title: topic.title,
    introduction: topic.description + ' This theory guide explores memory mappings, standard operations, and performance considerations.',
    objectives,
    prerequisites,
    theory,
    visualization: { type: 'placeholder', message: 'Interactive Visualization Coming Soon' },
    syntax,
    dryRun,
    complexity,
    mistakes,
    interviewTips,
    applications,
    summary
  };
}

// Generate 3 practice problems per topic
function generateProblemsForTopic(topicId: string, topicSlug: string, topicTitle: string) {
  return [
    {
      title: `${topicTitle} Target Search`,
      slug: `${topicSlug}-target-search`,
      difficulty: 'Easy',
      estimatedTime: '15 mins',
      statement: `Given an input structure of ${topicTitle} elements and a target key, design a function to find if the key exists inside the structure. Return the 0-indexed position if it exists, or -1 if the key is not found.`,
      constraints: '• 1 <= N <= 10,000\n• -10^9 <= elements[i] <= 10^9\n• -10^9 <= target <= 10^9',
      inputFormat: 'First line contains integer N, representing element count.\nSecond line contains N spaced elements.\nThird line contains target search integer.',
      outputFormat: 'Print the 0-indexed index of the element if found, otherwise print -1.',
      sampleInput: 'N = 4\nelements = 10 25 30 45\ntarget = 30',
      sampleOutput: '2',
      explanation: 'Target key 30 exists at index 2 (10 is index 0, 25 is index 1, 30 is index 2).'
    },
    {
      title: `Reverse ${topicTitle} Order`,
      slug: `reverse-${topicSlug}-order`,
      difficulty: 'Medium',
      estimatedTime: '25 mins',
      statement: `Design a logic to invert or reverse the sequence of items in a ${topicTitle} representation in-place. You must not use extra collections or buffer arrays; the swap operations must run in auxiliary space complexity O(1).`,
      constraints: '• 0 <= elements.length <= 50,000\n• -10^6 <= elements[i] <= 10^6',
      inputFormat: 'Spaced sequence representing the elements.',
      outputFormat: 'Print the reversed sequence of elements.',
      sampleInput: 'elements = 5 10 15 20',
      sampleOutput: '20 15 10 5',
      explanation: 'Reversing the linear order of elements swaps 5 with 20 and 10 with 15.'
    },
    {
      title: `Optimize ${topicTitle} Paths`,
      slug: `optimize-${topicSlug}-paths`,
      difficulty: 'Hard',
      estimatedTime: '45 mins',
      statement: `You are given a nested configurations grid representing sequential dependencies between ${topicTitle} structures. Devise a pathway optimization algorithm that removes any redundant reference loops, minimizing overall travel cost while keeping access endpoints identical.`,
      constraints: '• 1 <= Vertices <= 10^5\n• 1 <= Edges <= 2 * 10^5\n• Traversal must complete in time complexity O(V + E).',
      inputFormat: 'Line configurations indicating path linkages.',
      outputFormat: 'Print the minimal list of active edges.',
      sampleInput: 'nodes = A B C\nedges = A->B(cost 2), B->C(cost 3), A->C(cost 8)',
      sampleOutput: 'A->B B->C',
      explanation: 'Accessing C from A directly costs 8, whereas traversing transitively via B costs 5. The direct edge A->C is redundant and optimized out.'
    }
  ].map((p) => ({
    ...p,
    topicId
  }));
}

async function main() {
  console.log('Seeding topics, detailed lessons, and practice problems...');
  
  for (let i = 0; i < topicsData.length; i++) {
    const t = topicsData[i];
    const prevSlug = i > 0 ? topicsData[i - 1].slug : null;

    // 1. Upsert Topic
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        title: t.title,
        slug: t.slug,
        description: t.description,
        difficulty: t.difficulty,
        estimatedTime: t.estimatedTime,
        category: t.category,
        order: t.order,
        content: t.content
      }
    });

    // 2. Generate and Upsert Lesson
    const lessonData = generateLesson(t, topic.id, prevSlug);
    await prisma.lesson.upsert({
      where: { topicId: topic.id },
      update: {},
      create: lessonData
    });

    // 3. Generate and Upsert Practice Problems
    const problems = generateProblemsForTopic(topic.id, topic.slug, topic.title);
    for (const p of problems) {
      await prisma.problem.upsert({
        where: { slug: p.slug },
        update: {},
        create: p
      });
    }
  }

  console.log('Seeding initial achievements...');
  const achievements = [
    { title: 'First Login', description: 'Begin your Java DSA learning journey.', icon: 'login', xpReward: 50 },
    { title: 'First Lesson Completed', description: 'Complete your first lesson module.', icon: 'lesson-1', xpReward: 100 },
    { title: '10 Problems Solved', description: 'Solve 10 practice problems successfully.', icon: 'solved-10', xpReward: 250 },
    { title: '50 Problems Solved', description: 'Solve 50 practice problems successfully.', icon: 'solved-50', xpReward: 500 },
    { title: '100 Problems Solved', description: 'Solve 100 practice problems successfully.', icon: 'solved-100', xpReward: 1000 },
    { title: '7 Day Streak', description: 'Maintain a 7-day study and practice streak.', icon: 'streak-7', xpReward: 300 },
    { title: '30 Day Streak', description: 'Maintain a 30-day study and practice streak.', icon: 'streak-30', xpReward: 800 },
    { title: 'Notes Master', description: 'Create 5 study notes worksheets.', icon: 'notes-master', xpReward: 150 },
    { title: 'Revision Expert', description: 'Complete 5 scheduled spaced repetition reviews.', icon: 'revision-expert', xpReward: 200 },
    { title: 'Graph Master', description: 'Solve all Graph practice problems.', icon: 'graph-master', xpReward: 400 },
    { title: 'DP Expert', description: 'Solve all Dynamic Programming practice problems.', icon: 'dp-expert', xpReward: 500 }
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { title: ach.title },
      update: {
        description: ach.description,
        icon: ach.icon,
        xpReward: ach.xpReward
      },
      create: ach
    });
  }

  console.log('Successfully seeded all topics, lessons, practice problems, and achievements.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
