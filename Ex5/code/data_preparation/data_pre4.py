import os
import json
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# 下载所需的nltk资源
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

# 基础停用词
nltk_stop_words = set(stopwords.words('english'))
additional_stopwords = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having",
    "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his",
    "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its",
    "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on",
    "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's",
    "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who",
    "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
    "you're", "you've", "your", "yours", "yourself", "yourselves",
    
    "use", "used", "using", "uses", "utilize", "utilizes", "utilized", "utilizing",
    "apply", "applies", "applied", "applying",
    "implement", "implements", "implemented", "implementing",
    "develop", "develops", "developed", "developing",
    "conduct", "conducts", "conducted", "conducting",
    "provide", "provides", "provided", "providing",
    "make", "makes", "made", "making",
    "take", "takes", "taken", "taking",
    "get", "gets", "got", "getting",
    "increase", "increases", "increased", "increasing",
    "enhance", "enhances", "enhanced", "enhancing",
    "perform", "performs", "performed", "performing",
    "create", "creates", "created", "creating",
    "enable", "enables", "enabled", "enabling",
    "extract", "extracts", "extracted", "extracting",
    "train", "trains", "trained", "training",
    "evaluate", "evaluates", "evaluated", "evaluating",
    "analyze", "analyzes", "analyzed", "analyzing",
    "find", "finds", "found", "finding",
    
    "also", "very", "really", "extremely", "highly", "significantly", "mainly", "often",
    "frequently", "usually", "generally", "primarily", "specifically", "simply",
    
    "data", "dataset", "datasets", "information", "information-based",
    "algorithm", "algorithms", "model", "models", "system", "systems",
    "approach", "approaches", "method", "methods", "technique", "techniques",
    "process", "processes", "implementation", "implementations", "implement",
    "implementation", "usage", "utilization", "usage", "performance",
    "optimization", "optimizations", "optimizer", "optimizers", "regularization",
    "regularizations", "regularizing", "regularized", "overfitting", "underfitting",
    "bias", "biases", "variance", "variance", "fairness", "debiasing",
    "defenses", "defence", "robustness", "defending", "defend", "attack",
    "attacks", "adversaries", "attacker", "exploiting", "vulnerability",
    "vulnerabilities", "backdoors", "malicious", "privacy", "detecting",
    "privacypreserving", "threat", "secure", "security", "svm", "svms",
    "ensemble", "ensembles", "boosting", "boosted", "adaboost", "bagging",
    "boost", "dropout", "lasso", "loss", "regression", "predictable",
    "descent", "minimize", "minimized", "stochastic", "iteration",
    "approximating", "binarypredicate", "embeddingbased", "wordembeddings",
    "gnn", "relu", "latent", "variational", "simultaneously",
    "empirical", "neurocomputing", "geometry", "kernels", "maxpooling",
    "densegpu", "voxelwise", "normalized", "uncertainty",
    
    "based", "based", "based", "based", "based", "based", "based",
    "study", "studies", "studied", "studying", "research", "researches",
    "researched", "researching", "findings", "findings", "related",
    "relate", "relates", "related", "relating", "features", "feature",
    "feature", "features", "feature", "feature", "feature",
    "feature", "feature", "feature", "feature", "feature",
    "results", "result", "results", "resulting",
    "similar", "similarity", "similarities", "similar",
    "similar", "similar", "similar", "similar", "similar",
    "significant", "significantly", "significance", "significances",
    "different", "differently", "difference", "differences",
    "comparison", "comparisons", "compare", "compares",
    "comparing", "compared",
    "some", "somewhat", "somehow", "sometimes", "someplace",
    "something", "sometime", "somewhere",
}
stop_words = nltk_stop_words.union(additional_stopwords)

# 领域特定停用词
domain_stopwords = {
    "cs.AI": {
        "algorithm", "model", "learning", "neural", "network", "deep", "machine",
        "data", "training", "prediction", "classification", "regression",
        "reinforcement", "supervised", "unsupervised", "representation",
        "feature", "optimization", "loss", "activation", "backpropagation",
        "convolution", "recurrent", "sequence", "generation", "natural",
        "language", "processing", "computer", "vision", "speech", "recognition",
        "ai", "artificial", "intelligence", "robotics", "agent", "planning",
        "reasoning", "decision", "making", "knowledge", "base", "symbolic",
        "probabilistic", "graphical", "bayesian", "inference", "clustering",
        "dimensionality", "reduction", "transfer", "learning"
    },
    "cs.LG": {
        "gradient", "boosting", "ensemble", "support", "vector", "decision",
        "tree", "random", "forest", "k-means", "clustering", "dimensionality",
        "reduction", "principal", "component", "analysis", "pca", "svm",
        "naive", "bayes", "logistic", "regression", "neural", "network",
        "deep", "learning", "backpropagation", "overfitting", "regularization",
        "cross-validation", "hyperparameter", "tuning", "feature", "selection",
        "extraction", "unsupervised", "supervised", "reinforcement", "learning"
    },
    "cs.CC": {
        "complexity", "algorithm", "problem", "np", "p", "np-complete", "np-hard",
        "reduction", "approximation", "polynomial", "time", "space", "decider",
        "computational", "hardness", "reducible", "intractable", "efficient",
        "inefficient", "deterministic", "non-deterministic", "oracle", "class",
        "hierarchy", "lower", "upper", "bound", "completeness", "decidability",
        "closure", "transformation", "simulation"
    },
    "cs.LO": {
        "logic", "propositional", "predicate", "quantifier", "theorem", "proof",
        "deduction", "induction", "model", "satisfiability", "validity", "tautology",
        "contradiction", "syntax", "semantics", "calculus", "formal",
        "system", "axiom", "rule", "inference", "resolution", "completeness",
        "soundness", "consistency", "compactness", "expressiveness", "decidability",
        "undecidability", "intuitionistic", "modal", "temporal", "description",
        "non-classical", "proof-theoretic", "model-theoretic"
    },
    "cs.MA": {
        "multimedia", "image", "video", "audio", "compression", "encoding",
        "decoding", "transmission", "streaming", "codec",
        "resolution", "frame", "bitrate", "format", "metadata", "transcoding",
        "scaling", "rendering", "visualization", "signal", "processing",
        "storage", "retrieval", "content", "delivery", "network", "bandwidth",
        "latency", "buffering", "adaptive", "bitrate", "streaming",
        "live", "broadcast", "on-demand", "content", "distribution", "cdns",
        "content", "delivery", "network", "buffer", "management", "caching",
        "content", "aware", "networking", "quality", "of", "service", "qos",
        "error", "resilience", "protocol", "tcp", "udp", "http", "rtmp",
        "hls", "dash", "low-latency", "streaming", "edge", "computing",
        "cloud", "computing", "distributed", "systems", "parallel", "processing",
        "real-time", "processing", "video", "analytics", "compression",
        "techniques", "rate", "distortion", "trade-off", "adaptive",
        "streaming", "live", "video", "coding", "h.264", "h.265", "vp9",
        "av1", "hevc", "mpeg", "jpeg", "image", "compression", "techniques",
        "image", "processing", "enhancement", "filtering", "segmentation",
        "feature", "extraction", "object", "recognition", "video",
        "tracking", "motion", "detection", "audio", "processing", "speech",
        "recognition", "audio", "synthesis", "music", "information",
        "retrieval", "sound", "engineering", "audio", "signal", "processing",
        "digital", "signal", "processing", "speech", "synthesis", "voice",
        "recognition", "multimedia", "information", "retrieval", "mir"
    },
    "cs.CL": {
        "language", "processing", "natural", "syntax", "semantics", "corpus",
        "tokenization", "parsing", "morphology", "phonology", "pragmatics",
        "discourse", "lexicon", "grammar", "tagging", "entity", "recognition",
        "sentiment", "analysis", "machine", "translation", "generation",
        "understanding", "correspondence", "alignment", "vector",
        "embedding", "representation", "topic", "modeling", "dialogue",
        "conversation", "speech", "recognition", "synthesis", "bert",
        "gpt", "transformer", "attention", "sequence", "labeling",
        "classification", "information", "retrieval"
    },
    "cs.IR": {
        "information", "retrieval", "search", "query", "indexing", "ranking",
        "document", "collection", "term", "frequency", "inverted", "index",
        "bm25", "tf-idf", "relevance", "precision", "recall", "f1-score",
        "pagerank", "click-through", "user", "feedback", "personalization",
        "recommendation", "semantic", "search", "natural", "language",
        "processing", "vector", "space", "model", "latent", "dirichlet",
        "topic", "model", "lda", "information", "gain", "rocchio", "vector",
        "space", "model", "latent", "semantic", "analysis", "lsa", "lsi"
    },
    "cs.PL": {
        "language", "compiler", "interpreter", "syntax", "semantics", "parsing",
        "type", "system", "typechecking", "static", "dynamic", "typing",
        "inference", "garbage", "collection", "optimization", "code", "generation",
        "runtime", "environment", "memory", "management", "lambda", "calculus",
        "functional", "object-oriented", "imperative", "declarative",
        "concurrent", "parallel", "asynchronous", "synchronous", "framework",
        "library", "dependency", "injection", "inversion", "control",
        "event-driven", "architecture", "domain-driven", "design",
        "tdd", "bdd", "cicd", "continuous", "testing", "code", "coverage",
        "static", "analysis", "linting", "formatting", "code", "style"
    },
    "cs.CG": {
        "graphics", "rendering", "modeling", "animation", "ray", "tracing",
        "shading", "lighting", "texture", "mapping", "vertex", "fragment",
        "shader", "mesh", "geometry", "vertex", "buffer", "opengl", "directx",
        "vulkan", "gpu", "parallel", "computation", "real-time", "simulation",
        "visualization", "bump", "normal", "displacement", "anti-aliasing",
        "bloom", "depth", "of", "field", "motion", "blur", "ambient", "occlusion",
        "path", "tracing", "global", "illumination", "phong", "blinn-phong",
        "pbr", "physically-based", "rendering", "subdivision", "surface",
        "bezier", "catmull-clark", "nurbs", "rasterization", "tessellation"
    },
    "cs.GR": {
        "graphics", "rendering", "modeling", "animation", "ray", "tracing",
        "shading", "lighting", "texture", "mapping", "vertex", "fragment",
        "shader", "mesh", "geometry", "vertex", "buffer", "opengl", "directx",
        "vulkan", "gpu", "parallel", "computation", "real-time", "simulation",
        "visualization", "bump", "normal", "displacement", "anti-aliasing",
        "bloom", "depth", "of", "field", "motion", "blur", "ambient", "occlusion",
        "path", "tracing", "global", "illumination", "phong", "blinn-phong",
        "pbr", "physically-based", "rendering", "subdivision", "surface",
        "bezier", "catmull-clark", "nurbs", "rasterization", "tessellation"
    },
    "cs.RO": {
        "optimization", "linear", "programming", "integer", "nonlinear",
        "dynamic", "programming", "constraint", "satisfaction", "heuristic",
        "metaheuristic", "genetic", "algorithm", "simulated", "annealing",
        "tabu", "search", "branch", "bound", "cutting", "plane", "dual",
        "simplex", "network", "flow", "integer", "programming", "linear",
        "relaxation", "bilevel", "programming", "stochastic", "optimization",
        "combinatorial", "optimization", "knapsack", "problem", "traveling",
        "salesman", "vehicle", "routing", "scheduling", "resource", "allocation",
        "cost", "minimization", "maximization", "objective", "function",
        "feasibility", "optimality", "approximation", "ratio", "polynomial",
        "time", "complexity", "branch-and-bound", "cutting-plane",
        "column-generation", "decomposition", "lagrangian", "relaxation",
        "dual", "variables", "constraints", "objective", "space"
    },
    "cs.DB": {
        "database", "sql", "nosql", "query", "transaction", "schema",
        "normalization", "indexing", "replication", "sharding", "consistency",
        "availability", "partition", "tolerance", "b-tree", "hash",
        "relational", "model", "document", "key-value", "graph", "store",
        "data", "warehouse", "big", "data", "hadoop", "spark", "storage",
        "management", "backup", "recovery", "concurrency", "locking",
        "acid", "cap", "theorem", "database", "administration", "optimization",
        "query", "processing", "join", "aggregation", "transaction",
        "log", "buffer", "pool", "columnar", "in-memory", "distributed",
        "database", "systems", "data", "integrity", "constraints", "foreign",
        "key", "primary", "key", "unique", "constraints", "triggers",
        "stored", "procedures", "views", "materialized", "views", "index",
        "maintenance", "caching", "query", "optimization", "execution",
        "plan", "optimizer"
    },
    "cs.IT": {
        "information", "entropy", "mutual", "information", "channel",
        "capacity", "coding", "source", "coding", "channel", "coding",
        "compression", "data", "transmission", "noise", "rate", "distortion",
        "rate-distortion", "theory", "error", "correction", "decoding",
        "encoding", "source", "entropy", "shannon", "fano", "huffman",
        "arithmetic", "coding", "block", "codes", "convolutional", "codes",
        "linear", "codes", "turbo", "codes", "ldpc", "codes", "capacity",
        "achieving", "rates", "optimal", "codes", "information", "capacity",
        "theorem", "information", "bottleneck", "data", "processing",
        "information", "geometry", "information", "flow", "coding", "schemes",
        "network", "information", "theory", "source", "coding", "channels"
    },
    "cs.NE": {
        "neural", "network", "deep", "learning", "backpropagation",
        "activation", "layer", "weight", "bias", "gradient", "descent",
        "optimizer", "loss", "function", "convolutional", "recurrent",
        "lstm", "gru", "cnn", "rnn", "dropout", "regularization",
        "batch", "normalization", "fully", "connected", "dense",
        "architecture", "feedforward", "autoencoder", "generative",
        "adversarial", "gan", "encoder", "decoder", "latent", "space",
        "feature", "extraction", "representation", "transfer", "learning",
        "fine-tuning", "pretraining", "embedding", "word", "embedding",
        "sequence", "model", "attention", "transformer", "bert", "gpt",
        "self-attention", "multi-head", "positional", "encoding", "residual",
        "connections", "skip", "connections", "activation", "relu",
        "sigmoid", "tanh", "softmax", "cross-entropy", "mse", "adam",
        "sgd", "rmsprop"
    },
    "cs.DS": {
        "data", "science", "analysis", "statistics", "machine", "learning",
        "big", "data", "visualization", "exploratory", "data", "mining",
        "predictive", "modeling", "data", "preprocessing", "feature",
        "engineering", "dimensionality", "reduction", "clustering",
        "classification", "regression", "time", "series", "forecasting",
        "natural", "language", "processing", "deep", "learning", "neural",
        "network", "supervised", "unsupervised", "reinforcement",
        "learning", "data", "wrangling", "data", "cleaning", "data",
        "transformation", "statistical", "inference", "hypothesis",
        "testing", "p-value", "confidence", "interval", "bayesian",
        "methods", "probability", "distributions", "sampling", "techniques",
        "experimental", "design", "a/b", "testing", "model", "evaluation",
        "cross-validation", "metrics", "precision", "recall", "f1-score",
        "roc", "auc", "feature", "selection", "feature", "importance",
        "dimensionality", "reduction", "pca", "tsne", "umap", "clustering",
        "k-means", "hierarchical", "clustering", "dbscan", "anomaly",
        "detection", "outlier", "detection", "data", "augmentation",
        "resampling", "imbalance", "handling", "data", "integration",
        "data", "fusion", "multimodal", "data", "analysis"
    },
    "cs.DL": {
        "deep", "learning", "neural", "network", "backpropagation",
        "activation", "layer", "weight", "bias", "gradient", "descent",
        "optimizer", "loss", "function", "convolutional", "recurrent",
        "lstm", "gru", "cnn", "rnn", "dropout", "regularization",
        "batch", "normalization", "fully", "connected", "dense",
        "architecture", "feedforward", "autoencoder", "generative",
        "adversarial", "gan", "encoder", "decoder", "latent", "space",
        "feature", "extraction", "representation", "transfer", "learning",
        "fine-tuning", "pretraining", "embedding", "word", "embedding",
        "sequence", "model", "attention", "transformer", "bert", "gpt",
        "self-attention", "multi-head", "positional", "encoding", "residual",
        "connections", "skip", "connections", "activation", "relu",
        "sigmoid", "tanh", "softmax", "cross-entropy", "mse", "adam",
        "sgd", "rmsprop", "batch", "size", "epochs", "training",
        "validation", "testing", "overfitting", "underfitting",
        "early", "stopping", "regularization", "dropout", "data", "augmentation",
        "hyperparameter", "tuning", "learning", "rate", "scheduler",
        "gradient", "clipping", "weight", "initialization", "batch", "normalization",
        "layer", "normalization", "group", "normalization", "instance",
        "normalization", "dropconnect", "batch", "renormalization"
    },
    "cs.SE": {
        "software", "engineering", "development", "design", "architecture",
        "testing", "maintenance", "deployment", "agile", "scrum",
        "kanban", "waterfall", "devops", "continuous", "integration",
        "continuous", "deployment", "version", "control", "repository",
        "git", "svn", "bug", "tracking", "issue", "management", "requirements",
        "specification", "modeling", "uml", "use", "case", "diagram",
        "object-oriented", "programming", "oop", "refactoring", "code",
        "review", "pair", "programming", "testing", "unit", "integration",
        "system", "acceptance", "automation", "quality", "assurance",
        "performance", "optimization", "scalability", "usability",
        "security", "documentation", "project", "management", "stakeholder",
        "risk", "management", "sprint", "backlog", "user", "story",
        "wireframe", "prototyping", "design", "patterns", "mvc",
        "mvvm", "repository", "factory", "singleton", "observer",
        "strategy", "adapter", "decorator", "command", "chain",
        "responsibility", "pattern", "architecture", "microservices",
        "monolithic", "service-oriented", "architecture", "soa",
        "api", "rest", "graphql", "soap", "middleware", "framework",
        "library", "dependency", "injection", "inversion", "control",
        "event-driven", "architecture", "domain-driven", "design",
        "tdd", "bdd", "cicd", "continuous", "testing", "code", "coverage",
        "static", "analysis", "linting", "formatting", "code", "style"
    },
    "cs.CE": {
        "economics", "computational", "modeling", "simulation", "agent-based",
        "game", "theory", "market", "design", "mechanism", "incentive",
        "compatibility", "equilibrium", "auction", "pricing", "strategy",
        "optimization", "network", "analysis", "big", "data", "machine",
        "learning", "prediction", "forecasting", "behavioral", "economics",
        "microeconomics", "macroeconomics", "econometric", "models",
        "statistical", "analysis", "policy", "evaluation", "decision",
        "making", "information", "asymmetry", "contract", "theory",
        "mechanism", "design", "computation", "algorithmic", "game",
        "theoretical", "framework", "simulation", "stochastic",
        "dynamic", "optimization", "network", "effect", "market",
        "structure", "competition", "collusion", "price", "discrimination",
        "mechanism", "incentive", "compatibility", "revenue", "equivalence",
        "proof", "algorithm", "implementation", "computational",
        "complexity", "matching", "market", "design", "auction",
        "mechanism", "design", "auction", "strategyproof", "truthful",
        "incentive-compatible", "single", "item", "multi-item", "auction",
        "mechanism", "Vickrey", "auction", "first-price", "second-price",
        "sealed-bid", "open-bid", "combinatorial", "auction", "mechanism",
        "design", "network", "effect", "matching", "algorithm"
    },
    "cs.MS": {
        "multimedia", "systems", "image", "video", "audio", "compression",
        "encoding", "decoding", "transmission", "streaming", "codec",
        "resolution", "frame", "bitrate", "format", "metadata", "transcoding",
        "scaling", "rendering", "content", "delivery", "network", "bandwidth",
        "latency", "buffering", "adaptive", "bitrate", "streaming",
        "live", "broadcast", "on-demand", "distribution", "cdns",
        "buffer", "management", "caching", "content", "aware",
        "networking", "quality", "of", "service", "qos",
        "error", "resilience", "protocol", "tcp", "udp", "http", "rtmp",
        "hls", "dash", "low-latency", "streaming", "edge", "computing",
        "cloud", "computing", "distributed", "systems", "parallel", "processing",
        "real-time", "processing", "video", "analytics", "compression",
        "techniques", "rate", "distortion", "trade-off", "adaptive",
        "streaming", "live", "video", "coding", "h.264", "h.265", "vp9",
        "av1", "hevc", "mpeg", "jpeg", "image", "compression", "techniques",
        "image", "processing", "enhancement", "filtering", "segmentation",
        "feature", "extraction", "object", "recognition", "video",
        "tracking", "motion", "detection", "audio", "processing", "speech",
        "recognition", "audio", "synthesis", "music", "information",
        "retrieval", "sound", "engineering", "audio", "signal", "processing",
        "digital", "signal", "processing", "speech", "synthesis", "voice",
        "recognition", "multimedia", "information", "retrieval", "mir"
    },
    "cs.SC": {
        "scientific", "computing", "simulation", "modeling", "numerical",
        "analysis", "high-performance", "computing", "hpc", "parallel",
        "processing", "distributed", "systems", "supercomputing", "algorithm",
        "optimization", "finite", "element", "method", "computational",
        "fluid", "dynamics", "computational", "chemistry", "computational",
        "biology", "data", "analysis", "machine", "learning", "big",
        "data", "visualization", "grid", "computing", "cloud", "computing",
        "gpu", "computing", "architecture", "memory", "hierarchy", "storage",
        "network", "latency", "bandwidth", "scalability", "load",
        "balancing", "fault", "tolerance", "checkpointing", "resilience", "task",
        "scheduling", "resource", "allocation", "performance", "profiling",
        "optimization", "code", "parallelization", "vectorization",
        "threading", "mpi", "openmp", "cuda", "opencl", "performance",
        "tuning", "benchmarking", "scalability", "efficiency", "throughput",
        "latency", "power", "consumption", "energy", "efficiency",
        "heterogeneous", "computing", "multicore", "processing",
        "accelerators", "fpga", "asic", "hardware", "architecture",
        "performance", "evaluation", "profiling", "debugging",
        "optimization", "compiler", "techniques", "memory", "optimization",
        "data", "locality", "cache", "optimization", "vector", "instructions",
        "pipeline", "parallel", "algorithms", "numerical", "methods",
        "simulation", "models", "scientific", "applications"
    },
    "cs.DC": {
        "data", "center", "datacenter", "servers", "storage", "networking",
        "virtualization", "cloud", "computing", "rack", "cooling", "power",
        "management", "virtual", "machines", "vm", "containers", "docker",
        "kubernetes", "hypervisor", "scalability", "redundancy", "fault",
        "tolerance", "backup", "recovery", "disaster", "recovery", "load",
        "balancing", "security", "firewall", "encryption", "access",
        "control", "monitoring", "analytics", "automation", "orchestration",
        "infrastructure", "as", "a", "service", "iaas", "paas", "saas",
        "network", "latency", "bandwidth", "throughput", "virtual",
        "networking", "software-defined", "networking", "sdn", "network",
        "function", "virtualization", "nfv", "hyperconverged", "infrastructure",
        "hci", "storage", "area", "network", "san", "nas", "object",
        "storage", "solutions", "block", "storage", "file", "storage",
        "cloud", "storage", "scalability", "availability", "performance",
        "cost", "optimization", "resource", "allocation", "capacity",
        "planning", "data", "deduplication", "compression", "tiering",
        "erasure", "coding", "data", "protection", "disaster", "recovery",
        "green", "computing", "energy", "efficiency", "sustainability",
        "cooling", "techniques", "power", "management", "renewable",
        "energy", "sources", "hardware", "optimization", "server",
        "consolidation", "virtualization", "resource", "management",
        "automation", "orchestration", "deployment", "configuration",
        "management", "monitoring", "performance", "analytics"
    },
    "cs.CV": {
        "human", "computer", "interaction", "hci", "usability", "user",
        "interface", "design", "usability", "testing", "user", "experience",
        "ux", "ui", "prototyping", "wireframing", "interaction", "design",
        "user", "centered", "design", "cognitive", "psychology", "affordance",
        "usability", "heuristics", "task", "analysis", "persona", "scenario",
        "user", "research", "interviews", "surveys", "focus", "groups",
        "ethnography", "participatory", "design", "user", "testing",
        "A/B", "testing", "eye", "tracking", "click", "stream", "heatmaps",
        "usability", "metrics", "engagement", "satisfaction", "user",
        "feedback", "accessibility", "inclusive", "design", "responsive",
        "design", "mobile", "interface", "voice", "interaction", "augmented",
        "reality", "virtual", "reality", "gesture", "interaction", "wearable",
        "technology", "tangible", "interfaces", "multimodal",
        "interaction", "information", "visualization", "data", "visualization",
        "gamification", "user", "engagement", "emotional", "design",
        "persuasive", "technology", "behavioral", "design", "cultural",
        "considerations", "privacy", "security", "human", "factors",
        "cognitive", "load", "memory", "attention", "perception",
        "human", "performance", "error", "prevention", "interaction",
        "patterns", "best", "practices", "design", "guidelines",
        "user", "interface", "components", "consistency", "feedback",
        "affordance", "visibility", "learnability", "efficiency", "satisfaction"
    }
}

lemmatizer = WordNetLemmatizer()

numeric_words = {
    "zero","one","two","three","four","five","six","seven","eight","nine","ten",
    "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen",
    "twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety","hundred",
    "thousand","million","billion"
}

# 加载论文数据
with open('arxiv_cs_data\\all_papers.json', 'r', encoding='utf-8') as f:
    papers = json.load(f)

freq_dict = {}

for paper in papers:
    published = paper.get('published', '')
    if not published or len(published) < 4:
        continue
    year = published[:4]

    categories_list = paper.get('categories', [])
    paper_categories = []
    for cat_str in categories_list:
        for single_cat in cat_str.split(';'):
            single_cat = single_cat.strip()
            if single_cat.startswith('cs.'):
                paper_categories.append(single_cat)

    if not paper_categories:
        continue

    summary = paper.get('summary', '')
    tokens = word_tokenize(summary)
    tokens = [word.lower() for word in tokens if word.isalpha()]
    
    # 动态应用领域特定停用词
    current_stopwords = set(stop_words)
    for category in paper_categories:
        if category in domain_stopwords:
            current_stopwords = current_stopwords.union(domain_stopwords[category])
    
    tokens = [word for word in tokens if word not in current_stopwords]
    tokens = [lemmatizer.lemmatize(word) for word in tokens]
    tokens = [word for word in tokens if len(word) > 1 and word not in numeric_words]

    for category in paper_categories:
        freq_dict.setdefault(year, {})
        freq_dict[year].setdefault(category, {})
        for word in tokens:
            freq_dict[year][category][word] = freq_dict[year][category].get(word, 0) + 1

os.makedirs('keywords', exist_ok=True)

for year in freq_dict:
    for category in freq_dict[year]:
        keywords = freq_dict[year][category]
        sorted_keywords = dict(sorted(keywords.items(), key=lambda item: item[1], reverse=True))
        filename = f'keywords/{year}_{category}.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(sorted_keywords, f, ensure_ascii=False, indent=4)

print("关键词提取完成，结果已保存到 'keywords' 目录。")
