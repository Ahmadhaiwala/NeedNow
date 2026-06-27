'use client'

import { useState } from 'react'
import { mockGroups } from '@/lib/mock-data'
import { AnimatedPage } from '@/components/AnimatedPage'
import { GroupCard } from '@/components/GroupCard'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function GroupsPage() {
  const [groups] = useState(mockGroups)

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-beige pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-navy">Group Carts</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg font-semibold hover:bg-navy transition"
            >
              <Plus className="w-5 h-5" />
              Create Group
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <motion.div key={group.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GroupCard group={group} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
