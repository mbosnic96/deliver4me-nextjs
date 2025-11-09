'use client';

import { useState, useRef } from 'react';
import { CMSContent } from '@/lib/types/cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send, Clock, Users, CheckCircle } from 'lucide-react';

interface ContactSectionProps {
  data: CMSContent;
  className?: string;
  style?: React.CSSProperties;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  [key: string]: string;
}

function isColorDark(color: string): boolean {
  if (!color || color === 'transparent') return false;
  if (color === 'white' || color === '#ffffff' || color === '#fff' || color === 'rgb(255, 255, 255)') return false;
  if (color === 'black' || color === '#000000' || color === '#000' || color === 'rgb(0, 0, 0)') return true;
  if (color === '#1c2434' || color === '#0f172a') return true; 
  if (color === '#f8fafc' || color === '#f1f5f9') return false;
  
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.6;
    }
  }
  
  const hex = color.replace('#', '');
  const fullHex = hex.length === 3 
    ? hex.split('').map(c => c + c).join('')
    : hex;
  
  try {
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.6;
  } catch {
    return false;
  }
}

export default function ContactSection({ data, className = '', style }: ContactSectionProps) {
  const { title, subtitle, content } = data;
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);

  const bgColor = style?.backgroundColor || '#ffffff';
  const customTextColor = style?.color;
  const isDarkBg = isColorDark(bgColor);

  const titleTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send email using Nodemailer API route
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          to: content.email,
          subject: formData.subject || `Contact Form Message from ${formData.name}`,
        }),
      });

      if (response.ok) {
        console.log('Email sent successfully');
        setIsSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        }, 3000);
      } else {
        const error = await response.json();
        console.error('Failed to send email:', error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const formFields = content.formFields || ['name', 'email', 'message'];

  return (
    <section className={`py-20 relative overflow-hidden ${className}`} style={style}>
    
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{ color: titleTextColor }}
          >
            {title || 'Kontaktirajte nas'}
          </h2>
          {subtitle && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
              <Users size={16} />
              {subtitle}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="flex flex-col items-start bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 justify-center w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
              Kontakt informacije
            </h3>
            
            <div className="space-y-6">
              {content.email && (
                <div className="flex items-start gap-4 group cursor-pointer transition-all duration-300 hover:translate-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Mail className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">Email</h4>
                    <p className="text-gray-600 group-hover:text-purple-600 transition-colors">
                      {content.email}
                    </p>
                  </div>
                </div>
              )}

              {content.phone && (
                <div className="flex items-start gap-4 group cursor-pointer transition-all duration-300 hover:translate-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Phone className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">Phone</h4>
                    <p className="text-gray-600 group-hover:text-green-600 transition-colors">
                      {content.phone}
                    </p>
                  </div>
                </div>
              )}

              {content.address && (
                <div className="flex items-start gap-4 group cursor-pointer transition-all duration-300 hover:translate-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">Adresa</h4>
                    <p className="text-gray-600 group-hover:text-orange-600 transition-colors">
                      {content.address}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-8 pt-8 border-t border-gray-200 h-auto w-full justify-center align-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Clock size={14} />
                    Podrška
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">1 sat</div>
                  <div className="text-sm text-gray-600">Vrijeme odgovora</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form - Enhanced */}
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
              
              <CardContent className="p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="text-green-600" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Poruka poslana!</h3>
                    <p className="text-white mb-6">
                      Hvala Vam što ste nas kontaktirali. Odgovorit ćemo Vam u najkraćem mogućem roku.
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                    >
                      Pošalji novu poruku
                    </Button>
                  </div>
                ) : (
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formFields.includes('name') && (
                        <div className="relative">
                          <label 
                            htmlFor="name" 
                            className={`absolute left-4 transition-all duration-300 ${
                              focusedField === 'name' || formData.name 
                                ? 'top-2 text-xs text-purple-600 font-medium' 
                                : 'top-4 text-sm text-gray-500'
                            }`}
                          >
                            Ime
                          </label>
                          <Input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('name')}
                            onBlur={handleBlur}
                            className="pt-6 pb-2 px-4 border-2 border-gray-200 focus:border-purple-500 focus:ring-0 transition-all duration-300"
                          />
                        </div>
                      )}
                      
                      {formFields.includes('email') && (
                        <div className="relative">
                          <label 
                            htmlFor="email" 
                            className={`absolute left-4 transition-all duration-300 ${
                              focusedField === 'email' || formData.email 
                                ? 'top-2 text-xs text-purple-600 font-medium' 
                                : 'top-4 text-sm text-gray-500'
                            }`}
                          >
                            Email
                          </label>
                          <Input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('email')}
                            onBlur={handleBlur}
                            className="pt-6 pb-2 px-4 border-2 border-gray-200 focus:border-purple-500 focus:ring-0 transition-all duration-300"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formFields.includes('phone') && (
                        <div className="relative">
                          <label 
                            htmlFor="phone" 
                            className={`absolute left-4 transition-all duration-300 ${
                              focusedField === 'phone' || formData.phone 
                                ? 'top-2 text-xs text-purple-600 font-medium' 
                                : 'top-4 text-sm text-gray-500'
                            }`}
                          >
                            Broj telefona
                          </label>
                          <Input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('phone')}
                            onBlur={handleBlur}
                            className="pt-6 pb-2 px-4 border-2 border-gray-200 focus:border-purple-500 focus:ring-0 transition-all duration-300"
                          />
                        </div>
                      )}

                      {formFields.includes('subject') && (
                        <div className="relative">
                          <label 
                            htmlFor="subject" 
                            className={`absolute left-4 transition-all duration-300 ${
                              focusedField === 'subject' || formData.subject 
                                ? 'top-2 text-xs text-purple-600 font-medium' 
                                : 'top-4 text-sm text-gray-500'
                            }`}
                          >
                            Tema
                          </label>
                          <Input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('subject')}
                            onBlur={handleBlur}
                            className="pt-6 pb-2 px-4 border-2 border-gray-200 focus:border-purple-500 focus:ring-0 transition-all duration-300"
                          />
                        </div>
                      )}
                    </div>

                    {formFields.includes('message') && (
                      <div className="relative">
                        <label 
                          htmlFor="message" 
                          className={`absolute left-4 top-4 transition-all duration-300 ${
                            focusedField === 'message' || formData.message 
                              ? 'top-2 text-xs text-purple-600 font-medium' 
                              : 'text-sm text-gray-500'
                          }`}
                        >
                          Poruka
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          rows={6}
                          required
                          value={formData.message}
                          onChange={handleInputChange}
                          onFocus={() => handleFocus('message')}
                          onBlur={handleBlur}
                          className="pt-8 pb-4 px-4 border-2 border-gray-200 focus:border-purple-500 focus:ring-0 transition-all duration-300 resize-none"
                        />
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Slanje
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send size={20} />
                          Pošalji
                        </div>
                      )}
                    </Button>

                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}