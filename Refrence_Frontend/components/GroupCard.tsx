'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Group } from '@/lib/types'

interface GroupCardProps {
  group: Group
}

export function GroupCard({ group }: GroupCardProps) {
  const displayMembers = group.members.slice(0, 3)
  const hasMore = group.members.length > 3

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl border border-sky-blue p-6 hover:shadow-lg transition-shadow"
    >
      <h3 className="font-bold text-navy text-lg mb-4">{group.name}</h3>

      {/* Members Avatars */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-3">
          {displayMembers.map((member, idx) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full bg-sky-blue flex items-center justify-center text-sm font-semibold text-navy border-2 border-white"
            >
              {member.avatar}
            </div>
          ))}
        </div>
        {hasMore && (
          <span className="text-xs text-navy font-semibold ml-2">
            +{group.members.length - 3} more
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-sky-blue">
        <div>
          <p className="text-xs text-navy mb-1">Items</p>
          <p className="font-bold text-navy text-lg">{group.itemCount}</p>
        </div>
        <div>
          <p className="text-xs text-navy mb-1">Total</p>
          <p className="font-bold text-green text-lg">₹{group.totalPrice}</p>
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full flex items-center justify-between px-4 py-2 bg-teal text-white rounded-lg hover:bg-navy transition"
      >
        <span className="font-semibold">Open Group</span>
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}
