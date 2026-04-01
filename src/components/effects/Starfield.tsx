"use client"

import { useEffect, useRef } from "react"

type StarfieldProps = {
  stars?: number
  speed?: number
  spread?: number
  focal?: number
  twinkle?: number
  trail?: number
  size?: number
  fadeInRange?: number
  reverseFly?: boolean
  followCursor?: boolean
  background?: string
  starColor?: string
}

type StarPoint = {
  x: number
  y: number
  z: number
  tw: number
}

/**
 * StarsArea
 * Adapted from Framer Component: https://framer.com/m/Stars-Galaxy-mcPCjY.js
 */
export default function Starfield(props: StarfieldProps) {
  const {
    stars = 600,
    speed = 1.2,
    spread = 8,
    focal = 2.5,
    twinkle = 0.4,
    trail = 0.85,
    size = 1.2,
    fadeInRange = 6,
    reverseFly = true,
    followCursor = true,
    background = "transparent",
    starColor = "#6ee7b7",
  } = props

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: 0.5, y: 0.5 })
  const starsRef = useRef<StarPoint[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
    const createStar = (): StarPoint => ({
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: Math.random(),
      tw: Math.random() * Math.PI * 2,
    })

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) {
        return
      }

      const rect = parent.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = "100%"
      canvas.style.height = "100%"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener("resize", resize)
    starsRef.current = Array.from({ length: stars }, createStar)

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.current.x = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      mouse.current.y = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    }

    window.addEventListener("mousemove", onMouseMove)

    let raf = 0
    const animate = () => {
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      ctx.clearRect(0, 0, width, height)

      if (background !== "transparent") {
        ctx.globalAlpha = 1
        ctx.fillStyle = background
        ctx.fillRect(0, 0, width, height)
      }

      ctx.globalAlpha = 1
      ctx.fillStyle = starColor
      const centerX = followCursor ? mouse.current.x * width : width / 2
      const centerY = followCursor ? mouse.current.y * height : height / 2

      for (const star of starsRef.current) {
        const depth = star.z * clamp(focal, 0.01, 10) + 0.001
        const px = centerX + (star.x / depth) * width
        const py = centerY + (star.y / depth) * height

        star.z += reverseFly ? clamp(speed, 0, 10) * 0.002 : -clamp(speed, 0, 10) * 0.002

        if (star.z <= 0 || star.z > 1) {
          Object.assign(star, createStar())
        }

        star.tw += clamp(twinkle, 0, 1) * 0.05
        const alpha = Math.max(0, 1 - star.z / clamp(fadeInRange, 0.1, 10))
        const radius = clamp(size, 0.1, 5) * (1 - star.z) * (1 + Math.sin(star.tw) * clamp(twinkle, 0, 1))

        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      if (trail > 0) {
        ctx.globalAlpha = 1
      }

      raf = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
    }
  }, [background, fadeInRange, focal, followCursor, reverseFly, size, speed, spread, starColor, stars, trail, twinkle])

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  )
}
