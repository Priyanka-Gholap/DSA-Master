import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, Code, Cpu, Target, Award, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const features = [
    {
      icon: <Terminal className="h-6 w-6 text-indigo-400" />,
      title: 'Interactive Java Roadmap',
      desc: 'Navigate through visual, step-by-step learning paths. Master Arrays, Linked Lists, Trees, and Algorithms with structured clarity.',
    },
    {
      icon: <Cpu className="h-6 w-6 text-violet-400" />,
      title: 'AI-Powered Mentor',
      desc: 'Stuck on a dynamic programming bug? Get instant code reviews, complexity analysis, and tailored explanations from your AI guide.',
    },
    {
      icon: <Code className="h-6 w-6 text-pink-400" />,
      title: 'Integrated Coding Sandbox',
      desc: 'Write, compile, and run Java code directly in the browser. Test your solutions against rigorous test suites with live debugging.',
    },
    {
      icon: <Target className="h-6 w-6 text-amber-400" />,
      title: 'Smart Spaced Repetition',
      desc: 'Never forget what you learn. The platform automatically schedules periodic review cards for topics you found challenging.',
    },
  ];

  return (
    <div className="relative pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Tagline Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8"
        >
          <Award className="h-4 w-4 text-indigo-400" />
          The Premium Java DSA Suite
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading font-black text-4xl sm:text-6xl md:text-7xl tracking-tight text-white max-w-4xl leading-tight"
        >
          Master Java DSA. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Guided by AI Intelligence.
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl font-medium leading-relaxed"
        >
          Break through standard memorization. Learn algorithms visually, solve real problems inside our interactive workspace, and study effectively with custom AI mentorship.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Button
            onClick={() => navigate('/register')}
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
          >
            Start Learning Free
          </Button>
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            size="lg"
          >
            Access Dashboard
          </Button>
        </motion.div>

        {/* Interactive Mock Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3 shadow-2xl relative overflow-hidden backdrop-blur-sm"
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          <div className="rounded-xl overflow-hidden border border-slate-800/60 bg-slate-950 p-2 md:p-4 aspect-video flex flex-col">
            {/* Header controls of mock UI */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-3 text-slate-650">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-500 select-none bg-slate-900 px-3 py-1 rounded-md">
                DSAMaster // Dashboard
              </div>
              <div className="w-10 h-2 bg-slate-900 rounded-sm" />
            </div>
            
            {/* Mock Layout body */}
            <div className="flex-1 grid grid-cols-4 gap-4 text-left p-2">
              <div className="col-span-1 border border-dashed border-slate-900 rounded-xl p-3 space-y-2.5 hidden md:block">
                <div className="h-4 bg-slate-900 rounded w-3/4" />
                <div className="space-y-1">
                  <div className="h-3 bg-slate-900/65 rounded" />
                  <div className="h-3 bg-slate-900/65 rounded w-5/6" />
                  <div className="h-3 bg-slate-900/65 rounded w-2/3" />
                </div>
              </div>
              <div className="col-span-4 md:col-span-3 border border-dashed border-slate-900 rounded-xl p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-5 bg-gradient-to-r from-indigo-500/25 to-violet-500/25 rounded-md w-1/3" />
                  <div className="h-3 bg-slate-900 rounded w-2/3" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-14 bg-slate-900/50 rounded-lg p-2.5 flex flex-col justify-between">
                    <div className="h-2 bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-indigo-500/40 rounded w-3/4" />
                  </div>
                  <div className="h-14 bg-slate-900/50 rounded-lg p-2.5 flex flex-col justify-between">
                    <div className="h-2 bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-violet-500/40 rounded w-3/4" />
                  </div>
                  <div className="h-14 bg-slate-900/50 rounded-lg p-2.5 flex flex-col justify-between">
                    <div className="h-2 bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-purple-500/40 rounded w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
            Features Packed for Peak Mastery
          </h2>
          <p className="mt-4 text-slate-400 text-sm md:text-base font-medium">
            Everything you need to master Java DSA in a high-fidelity environment built for developers.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 gap-6"
        >
          {features.map((feat) => (
            <motion.div
              variants={itemVariants}
              key={feat.title}
              className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-indigo-500/35 hover:-translate-y-1 transition-all duration-300 flex gap-4 text-left"
            >
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex-shrink-0 h-12 w-12 flex items-center justify-center">
                {feat.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading font-semibold text-lg text-white">{feat.title}</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900/60">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-6">
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight">
              A Complete Java Core Ecosystem
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Skip setting up complex IDE configurations and debugging compilers locally. DSA Master handles everything in the cloud, giving you instant verification feedback, step-by-step algorithms trace options, and real-world Java runtime simulations.
            </p>
            
            <div className="space-y-3.5">
              {[
                'Standard Java compilation diagnostics',
                'Intuitive visualizations of execution heaps and structures',
                'Advanced tracking of big-O time & space complexities',
                'Integrated interview-level test execution flows',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 bg-slate-900/20 text-left space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Code className="h-5 w-5" />
              <span className="font-heading font-bold text-sm tracking-wide uppercase">Core Java Example</span>
            </div>
            <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl overflow-x-auto leading-relaxed border border-slate-900 shadow-inner">
{`public class Solution {
    // Reverse a Singly Linked List in O(n) Time
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section id="why-us" className="py-20 md:py-28 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900/60 text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
            Why Choose DSA Master?
          </h2>
          <p className="mt-4 text-slate-400 text-sm md:text-base font-medium">
            Traditional tutorials fail because they lack interactivity. DSA Master combines visual feedback, direct coding inputs, and adaptive revision schedules.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 text-left">
          {[
            {
              metric: '3x Faster',
              label: 'Concept Comprehension',
              desc: 'Visual animations trace node movements and loop variables in real-time, making tree traversals and sorting flows instantly understandable.',
            },
            {
              metric: '92%',
              label: 'Retention Boost',
              desc: 'Spaced repetition revision alerts prompt you to rewrite algorithms exactly when you are about to forget them, building long-term memory.',
            },
            {
              metric: 'AI-Guided',
              label: 'Tailored Feedbacks',
              desc: 'Instead of looking at code solutions directly, your AI coach guides you with clues and debugging hints to help you code it yourself.',
            },
          ].map((why) => (
            <div key={why.label} className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
              <span className="font-heading font-black text-3xl md:text-4xl bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {why.metric}
              </span>
              <div className="space-y-1.5">
                <h4 className="font-semibold text-sm text-slate-200 uppercase tracking-wider">{why.label}</h4>
                <p className="text-xs md:text-sm text-slate-450 leading-relaxed">{why.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-6 relative z-10 text-center">
        <div className="glass-card rounded-3xl p-8 md:p-14 border border-slate-800/90 bg-gradient-to-b from-indigo-950/20 to-slate-900/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          
          <h2 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Ready to Accelerate Your Career?
          </h2>
          <p className="mt-4 text-slate-450 text-sm md:text-base max-w-xl mx-auto font-medium">
            Join thousands of Java developers master data structures, solve algorithm challenges, and land FAANG-level engineering offers.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => navigate('/register')}
              variant="primary"
              size="lg"
              rightIcon={<ChevronRight className="h-4.5 w-4.5" />}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
