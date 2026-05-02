import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import styles from './ImageStrip.module.css'

const ImageStrip = () => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.06, 1.0, 1.06])
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.5, 1, 1, 0.5])

  return (
    <section ref={ref} className={styles.strip}>

      {/* Parallax image — BASQUE sign centred */}
      <motion.div className={styles.imageWrap} style={{ scale }}>
        <motion.img
          src="https://file.garden/aaq7u9giWjY0-o-W/BASQUE/bASQUE.png"
          alt="Basque — Dehradun"
          className={styles.image}
          style={{ opacity }}
        />
      </motion.div>

      {/* Gradient — clear window in the centre so the sign glows through */}
      <div className={styles.overlay} />

      {/* Text: eyebrow + headline at the TOP */}
      <motion.div
        className={styles.stamp}
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className={styles.stampEyebrow}>Dehradun · Uttarakhand</span>
        <h2 className={styles.stampHeading}>A Place That Stays With You.</h2>
        <div className={styles.stampRule} />
      </motion.div>

      {/* Sub-line: pinned to bottom so it sits below the sign */}
      <motion.p
        className={styles.stampSub}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 1.0 }}
      >
        Restaurant · Bar · Garden · Pickleball · Events
      </motion.p>

      {/* Amber hairline borders */}
      <div className={styles.edgeTop} />
      <div className={styles.edgeBottom} />
    </section>
  )
}

export default ImageStrip
