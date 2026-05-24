import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, Video, CreditCard, Activity, ArrowUpRight, ArrowDownRight, Plus, Search, Filter, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../data/ContentData';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [contentList, setContentList] = useState(CATEGORIES.flatMap(c => c.items));

  const stats = [
    { label: 'Total Revenue', value: '$124,500.00', trend: '+14.2%', up: true, icon: BarChart3 },
    { label: 'New Subscribers', value: '1,240', trend: '+8.1%', up: true, icon: Users },
    { label: 'Stream Time', value: '840k hrs', trend: '+22.5%', up: true, icon: Video },
    { label: 'Active Sessions', value: '4.2k', trend: '-2.1%', up: false, icon: Activity },
  ];

  const renderContentManager = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search content library..." 
            className="w-full bg-surface border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none transition-all"
          />
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-surface border border-gray-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-light transition-all">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 bg-primary text-black px-6 py-2 rounded-xl text-sm font-black uppercase tracking-wider hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
            <span>New Video</span>
          </button>
        </div>
      </div>

      <div className="bg-surface border border-gray-800 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800 bg-surface-light/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Thumbnail</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Title</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Access</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Duration</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {contentList.slice(0, 8).map((item) => (
              <tr key={item.id} className="hover:bg-surface-light/30 transition-colors">
                <td className="px-6 py-4">
                  <img src={item.thumbnail} alt="" className="w-16 aspect-video object-cover rounded-lg border border-gray-800" />
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-white">{item.title}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.isPremium ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-400'}`}>
                    {item.isPremium ? 'Premium' : 'Free'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-400">{item.duration}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-2">TFC Console</h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Command Center v2.4.0</p>
        </div>
        <div className="flex bg-surface border border-gray-800 p-1 rounded-2xl">
          {['analytics', 'content', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' ? (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-surface border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-primary transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-all" />
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-background border border-gray-800 rounded-2xl">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${stat.up ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      <span>{stat.trend}</span>
                      {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    </div>
                  </div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className="text-3xl font-black tracking-tighter">{stat.value}</h4>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-surface border border-gray-800 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-8">
                  <h5 className="text-lg font-black uppercase tracking-widest">Real-time Traffic</h5>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Stream Data</span>
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {[40, 60, 45, 90, 65, 80, 50, 75, 40, 85, 60, 95].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05 }}
                      className="flex-1 bg-gradient-to-t from-primary/10 to-primary rounded-t-lg"
                    />
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-gray-800 rounded-[2.5rem] p-8">
                <h5 className="text-lg font-black uppercase tracking-widest mb-8">User Origin</h5>
                <div className="space-y-6">
                  {[
                    { country: 'United States', value: '42%' },
                    { country: 'United Kingdom', value: '18%' },
                    { country: 'Germany', value: '12%' },
                    { country: 'Japan', value: '9%' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>{item.country}</span>
                        <span className="text-primary">{item.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-gray-800">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: item.value }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderContentManager()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default Admin;
