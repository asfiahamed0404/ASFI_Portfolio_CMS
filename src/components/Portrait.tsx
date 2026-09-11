import { motion, useReducedMotion, useSpring } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { PointerEvent } from 'react'
import portrait from '../../Asfi.png'

export default function Portrait() {
  const reducedMotion = useReducedMotion()
  const rotateX = useSpring(0, { stiffness: 160, damping: 24 })
  const rotateY = useSpring(0, { stiffness: 160, damping: 24 })

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    rotateX.set(((event.clientY - rect.top) / rect.height - 0.5) * -9)
    rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * 9)
  }

  return (
    <div className="pp-portrait-stage" onPointerMove={move} onPointerLeave={() => { rotateX.set(0); rotateY.set(0) }}>
      <div className="pp-portrait-coordinate" aria-hidden="true">PROFILE / 01</div>
      <motion.div className="pp-portrait-card" style={{ rotateX, rotateY }}>
        <div className="pp-portrait-photo">
          <img src={portrait} alt="Asfi Ahamed" width={1215} height={1295} fetchPriority="high" />
          <span className="pp-portrait-cross pp-portrait-cross-top" aria-hidden="true">+</span>
          <span className="pp-portrait-cross pp-portrait-cross-bottom" aria-hidden="true">+</span>
        </div>
        <div className="pp-portrait-caption"><span>ASFI AHAMED</span></div>
        <div className="pp-portrait-note"><ArrowUpRight size={24} aria-hidden="true" /><span>From a question.<br /><strong>To something real.</strong></span></div>
      </motion.div>
    </div>
  )
}
