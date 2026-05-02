import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const SectionLabel = ({ children, light = false, style = {} }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        fontFamily: 'var(--font-sc)',
        fontSize: '0.65rem',
        letterSpacing: '0.55em',
        color: 'var(--amber)',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </motion.p>
  )
}

export default SectionLabel
