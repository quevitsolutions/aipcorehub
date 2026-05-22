import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export function AnimatedCounter({ end, duration = 2000, format = v => v.toLocaleString(), suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * end))
          if (progress < 1) requestAnimationFrame(tick)
          else setCount(end)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{format(count)}{suffix}</span>
}

export function GlowCard({ children, color = '#CBFF01', style = {}, className = '' }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`card ${className}`}
      style={{
        position: 'relative', overflow: 'hidden',
        borderColor: hovered ? `${color}40` : 'rgba(255,255,255,0.08)',
        transition: 'border-color 0.3s',
        ...style
      }}
    >
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}
      {children}
    </motion.div>
  )
}

export function SectionHeader({ label, icon = '◈', title, desc, center = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      style={{ textAlign: center ? 'center' : 'left', marginBottom: 60 }}
    >
      <div className="section-label">{icon} {label}</div>
      <h2 className="section-title">{title}</h2>
      {desc && <p className="section-desc" style={{ margin: center ? '0 auto' : undefined }}>{desc}</p>}
    </motion.div>
  )
}

export function ParticleField({ count = 30 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 5,
    color: ['#CBFF01', '#4FFFFF', '#FF6BFF'][Math.floor(Math.random() * 3)],
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          opacity: 0.4,
          animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`,
          boxShadow: `0 0 6px ${p.color}`,
        }} />
      ))}
    </div>
  )
}
