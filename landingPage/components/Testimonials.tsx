import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  QuoteIcon,
  User,
  UserCheck,
} from 'lucide-react'
const testimonials = [
  {
    id: 1,
    content:
      'Scholardorm has revolutionized how I learn. The RSL module is particularly impressive, making education truly inclusive for deaf students like me.',
    author: 'Diane Mutoni',
    role: 'Student',
    gender: 'female',
    rating: 5,
  },
  {
    id: 2,
    content:
      "As an educator, I've seen firsthand how Scholardorm's interactive approach engages students and improves learning outcomes. The RSL feature is groundbreaking.",
    author: 'Jean-Paul Habimana',
    role: 'High School Teacher',
    gender: 'male',
    rating: 5,
  },
  {
    id: 3,
    content:
      "The platform's gamification elements make learning fun and competitive. My students are more motivated and their morale boast to complete their assignments.",
    author: 'Sister Josse',
    role: 'School Administrator',
    gender: 'female',
    rating: 4,
  },
  {
    id: 4,
    content:
      "The RSL module has helped me connect with my deaf classmates. Now we can study together and I've even learned basic sign language!",
    author: 'Eric Mugisha',
    role: 'Student',
    gender: 'male',
    rating: 5,
  },
]
export const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const nextTestimonial = () => {
    setActiveIndex(
      (prevIndex) => (prevIndex + 1) % Math.ceil(testimonials.length / 2),
    )
  }
  const prevTestimonial = () => {
    setActiveIndex(
      (prevIndex) =>
        (prevIndex - 1 + Math.ceil(testimonials.length / 2)) %
        Math.ceil(testimonials.length / 2),
    )
  }
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{
              opacity: 0,
              y: -10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
            }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            What Our Users Say
          </motion.h2>
          <motion.p
            initial={{
              opacity: 0,
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
            }}
            className="text-lg text-slate-600"
          >
            Hear from students and educators who have transformed their learning
            experience with Scholardorm.
          </motion.p>
        </div>
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${activeIndex * 100}%)`,
              }}
            >
              {[0, 1].map((pageIndex) => (
                <div key={pageIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {testimonials
                      .slice(pageIndex * 2, pageIndex * 2 + 2)
                      .map((testimonial) => (
                        <motion.div
                          key={testimonial.id}
                          initial={{
                            opacity: 0,
                            y: 20,
                          }}
                          whileInView={{
                            opacity: 1,
                            y: 0,
                          }}
                          viewport={{
                            once: true,
                          }}
                          transition={{
                            duration: 0.5,
                          }}
                          className="bg-slate-50 border border-slate-100 rounded-xl p-6 shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex space-x-4">
                              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                {testimonial.gender === 'female' ? (
                                  <UserCheck size={24} />
                                ) : (
                                  <User size={24} />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">
                                  {testimonial.author}
                                </h3>
                                <p className="text-sm text-slate-500">
                                  {testimonial.role}
                                </p>
                              </div>
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  size={16}
                                  className={
                                    i < testimonial.rating
                                      ? 'text-yellow-400'
                                      : 'text-slate-300'
                                  }
                                  fill={
                                    i < testimonial.rating
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <div className="relative">
                            <QuoteIcon
                              size={24}
                              className="absolute -top-2 -left-1 text-primary-200 opacity-50"
                            />
                            <p className="text-slate-700 pl-6">
                              {testimonial.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-8 space-x-2">
            {[...Array(Math.ceil(testimonials.length / 2))].map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${activeIndex === index ? 'bg-primary-600' : 'bg-slate-300'}`}
                aria-label={`Go to testimonial page ${index + 1}`}
              />
            ))}
          </div>
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-4 hidden md:block">
            <button
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Previous testimonials"
            >
              <ChevronLeftIcon size={20} />
            </button>
          </div>
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 hidden md:block">
            <button
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Next testimonials"
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
