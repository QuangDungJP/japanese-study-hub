export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          booking_id: string | null
          check_in_time: string | null
          class_id: string | null
          created_at: string
          id: string
          marked_by: string | null
          notes: string | null
          session_date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          check_in_time?: string | null
          class_id?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          session_date: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          check_in_time?: string | null
          class_id?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          session_date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          content_vi: string | null
          created_at: string
          excerpt: string | null
          excerpt_vi: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          tags: Json | null
          thumbnail_url: string | null
          title: string
          title_vi: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          content_vi?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_vi?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: Json | null
          thumbnail_url?: string | null
          title: string
          title_vi: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          content_vi?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_vi?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: Json | null
          thumbnail_url?: string | null
          title?: string
          title_vi?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          status: string
          teacher_id: string | null
          teacher_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          status?: string
          teacher_id?: string | null
          teacher_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          status?: string
          teacher_id?: string | null
          teacher_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          meet_link: string | null
          reference_id: string | null
          reference_type: string | null
          start_time: string
          title: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          meet_link?: string | null
          reference_id?: string | null
          reference_type?: string | null
          start_time: string
          title: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          meet_link?: string | null
          reference_id?: string | null
          reference_type?: string | null
          start_time?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      class_students: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          description_vi: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          max_students: number | null
          name: string
          name_vi: string
          schedule: Json | null
          start_date: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          description_vi?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          name: string
          name_vi: string
          schedule?: Json | null
          start_date?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          description_vi?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          name?: string
          name_vi?: string
          schedule?: Json | null
          start_date?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_lessons: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_form_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          label: string
          label_vi: string
          options: Json | null
          order_index: number | null
          placeholder: string | null
          placeholder_vi: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label: string
          label_vi: string
          options?: Json | null
          order_index?: number | null
          placeholder?: string | null
          placeholder_vi?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label?: string
          label_vi?: string
          options?: Json | null
          order_index?: number | null
          placeholder?: string | null
          placeholder_vi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          data: Json
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          data?: Json
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          data?: Json
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_teachers: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order_index: number | null
          role: string | null
          role_vi: string | null
          teacher_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order_index?: number | null
          role?: string | null
          role_vi?: string | null
          teacher_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number | null
          role?: string | null
          role_vi?: string | null
          teacher_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          certificate_image_url: string | null
          created_at: string
          custom_fields: Json
          description: string | null
          description_vi: string | null
          duration_weeks: number | null
          enrolled_count: number
          enrollment_capacity: number | null
          enrollment_status: string
          faq: Json
          features: Json | null
          gallery_urls: Json
          highlights: Json
          id: string
          intro_video_url: string | null
          is_published: boolean | null
          language: string
          level: string
          location: string | null
          location_vi: string | null
          long_description: string | null
          long_description_vi: string | null
          original_price: number | null
          outcomes: Json
          price: number
          requirements: Json
          schedule_text: string | null
          schedule_text_vi: string | null
          section_visibility: Json
          slug: string | null
          start_date: string | null
          subtitle: string | null
          subtitle_vi: string | null
          testimonials: Json
          thumbnail_url: string | null
          timeline: Json
          title: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          certificate_image_url?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          description_vi?: string | null
          duration_weeks?: number | null
          enrolled_count?: number
          enrollment_capacity?: number | null
          enrollment_status?: string
          faq?: Json
          features?: Json | null
          gallery_urls?: Json
          highlights?: Json
          id?: string
          intro_video_url?: string | null
          is_published?: boolean | null
          language?: string
          level?: string
          location?: string | null
          location_vi?: string | null
          long_description?: string | null
          long_description_vi?: string | null
          original_price?: number | null
          outcomes?: Json
          price?: number
          requirements?: Json
          schedule_text?: string | null
          schedule_text_vi?: string | null
          section_visibility?: Json
          slug?: string | null
          start_date?: string | null
          subtitle?: string | null
          subtitle_vi?: string | null
          testimonials?: Json
          thumbnail_url?: string | null
          timeline?: Json
          title: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          certificate_image_url?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          description_vi?: string | null
          duration_weeks?: number | null
          enrolled_count?: number
          enrollment_capacity?: number | null
          enrollment_status?: string
          faq?: Json
          features?: Json | null
          gallery_urls?: Json
          highlights?: Json
          id?: string
          intro_video_url?: string | null
          is_published?: boolean | null
          language?: string
          level?: string
          location?: string | null
          location_vi?: string | null
          long_description?: string | null
          long_description_vi?: string | null
          original_price?: number | null
          outcomes?: Json
          price?: number
          requirements?: Json
          schedule_text?: string | null
          schedule_text_vi?: string | null
          section_visibility?: Json
          slug?: string | null
          start_date?: string | null
          subtitle?: string | null
          subtitle_vi?: string | null
          testimonials?: Json
          thumbnail_url?: string | null
          timeline?: Json
          title?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_form_fields: {
        Row: {
          created_at: string
          event_id: string
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          label: string
          label_vi: string
          options: Json | null
          order_index: number | null
          placeholder: string | null
          placeholder_vi: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label: string
          label_vi: string
          options?: Json | null
          order_index?: number | null
          placeholder?: string | null
          placeholder_vi?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label?: string
          label_vi?: string
          options?: Json | null
          order_index?: number | null
          placeholder?: string | null
          placeholder_vi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_form_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          data: Json
          event_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          event_id: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          event_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          content_html: string | null
          content_html_vi: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_vi: string | null
          end_time: string | null
          event_date: string
          gallery_urls: Json | null
          id: string
          is_online: boolean | null
          is_published: boolean | null
          layout_style: string | null
          location: string | null
          location_vi: string | null
          max_participants: number | null
          meet_link: string | null
          slug: string | null
          start_time: string
          thumbnail_url: string | null
          title: string
          title_vi: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_html?: string | null
          content_html_vi?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_vi?: string | null
          end_time?: string | null
          event_date: string
          gallery_urls?: Json | null
          id?: string
          is_online?: boolean | null
          is_published?: boolean | null
          layout_style?: string | null
          location?: string | null
          location_vi?: string | null
          max_participants?: number | null
          meet_link?: string | null
          slug?: string | null
          start_time: string
          thumbnail_url?: string | null
          title: string
          title_vi: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_html?: string | null
          content_html_vi?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_vi?: string | null
          end_time?: string | null
          event_date?: string
          gallery_urls?: Json | null
          id?: string
          is_online?: boolean | null
          is_published?: boolean | null
          layout_style?: string | null
          location?: string | null
          location_vi?: string | null
          max_participants?: number | null
          meet_link?: string | null
          slug?: string | null
          start_time?: string
          thumbnail_url?: string | null
          title?: string
          title_vi?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      exam_registrations: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          score: number | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          score?: number | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          score?: number | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_registrations_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          description_vi: string | null
          duration_minutes: number
          exam_date: string
          exam_type: string
          id: string
          is_published: boolean | null
          location: string | null
          max_score: number | null
          meet_link: string | null
          passing_score: number | null
          start_time: string
          teacher_id: string
          title: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          description_vi?: string | null
          duration_minutes?: number
          exam_date: string
          exam_type?: string
          id?: string
          is_published?: boolean | null
          location?: string | null
          max_score?: number | null
          meet_link?: string | null
          passing_score?: number | null
          start_time: string
          teacher_id: string
          title: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          description_vi?: string | null
          duration_minutes?: number
          exam_date?: string
          exam_type?: string
          id?: string
          is_published?: boolean | null
          location?: string | null
          max_score?: number | null
          meet_link?: string | null
          passing_score?: number | null
          start_time?: string
          teacher_id?: string
          title?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          audio_url: string | null
          content: Json | null
          correct_answers: Json | null
          created_at: string | null
          exercise_type: string
          explanation: Json | null
          id: string
          instructions: string | null
          instructions_vi: string | null
          lesson_id: string
          order_index: number | null
          requires_grading: boolean | null
          title: string
          title_vi: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: Json | null
          correct_answers?: Json | null
          created_at?: string | null
          exercise_type: string
          explanation?: Json | null
          id?: string
          instructions?: string | null
          instructions_vi?: string | null
          lesson_id: string
          order_index?: number | null
          requires_grading?: boolean | null
          title: string
          title_vi: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: Json | null
          correct_answers?: Json | null
          created_at?: string | null
          exercise_type?: string
          explanation?: Json | null
          id?: string
          instructions?: string | null
          instructions_vi?: string | null
          lesson_id?: string
          order_index?: number | null
          requires_grading?: boolean | null
          title?: string
          title_vi?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean | null
          order_index: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason: string
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: Json | null
          content_html: string | null
          created_at: string | null
          description: string | null
          description_vi: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          language: string
          level: string
          order_index: number | null
          skill: string
          teacher_id: string | null
          thumbnail_url: string | null
          title: string
          title_vi: string
          updated_at: string | null
          video_url: string | null
          xp_reward: number | null
        }
        Insert: {
          content?: Json | null
          content_html?: string | null
          created_at?: string | null
          description?: string | null
          description_vi?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          language: string
          level: string
          order_index?: number | null
          skill: string
          teacher_id?: string | null
          thumbnail_url?: string | null
          title: string
          title_vi: string
          updated_at?: string | null
          video_url?: string | null
          xp_reward?: number | null
        }
        Update: {
          content?: Json | null
          content_html?: string | null
          created_at?: string | null
          description?: string | null
          description_vi?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          language?: string
          level?: string
          order_index?: number | null
          skill?: string
          teacher_id?: string | null
          thumbnail_url?: string | null
          title?: string
          title_vi?: string
          updated_at?: string | null
          video_url?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          booking_id: string | null
          calendar_event_id: string | null
          created_at: string
          end_time: string
          id: string
          meet_link: string
          start_time: string
        }
        Insert: {
          booking_id?: string | null
          calendar_event_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          meet_link: string
          start_time: string
        }
        Update: {
          booking_id?: string | null
          calendar_event_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          meet_link?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          bank_transfer_proof: string | null
          course_id: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_transfer_proof?: string | null
          course_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_transfer_proof?: string | null
          course_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      page_settings: {
        Row: {
          created_at: string
          display_name: string
          display_name_vi: string
          hero_subtitle: string | null
          hero_subtitle_vi: string | null
          hero_title: string | null
          hero_title_vi: string | null
          id: string
          is_active: boolean | null
          nav_label: string | null
          nav_label_vi: string | null
          order_index: number | null
          page_key: string
          route_path: string
          show_in_nav: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          display_name_vi: string
          hero_subtitle?: string | null
          hero_subtitle_vi?: string | null
          hero_title?: string | null
          hero_title_vi?: string | null
          id?: string
          is_active?: boolean | null
          nav_label?: string | null
          nav_label_vi?: string | null
          order_index?: number | null
          page_key: string
          route_path: string
          show_in_nav?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          display_name_vi?: string
          hero_subtitle?: string | null
          hero_subtitle_vi?: string | null
          hero_title?: string | null
          hero_title_vi?: string | null
          id?: string
          is_active?: boolean | null
          nav_label?: string | null
          nav_label_vi?: string | null
          order_index?: number | null
          page_key?: string
          route_path?: string
          show_in_nav?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_language: string | null
          full_name: string | null
          id: string
          theme_color: string | null
          theme_font: string | null
          theme_mode: string | null
          theme_scale: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_language?: string | null
          full_name?: string | null
          id?: string
          theme_color?: string | null
          theme_font?: string | null
          theme_mode?: string | null
          theme_scale?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_language?: string | null
          full_name?: string | null
          id?: string
          theme_color?: string | null
          theme_font?: string | null
          theme_mode?: string | null
          theme_scale?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_submissions: {
        Row: {
          content: string
          exercise_id: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          exercise_id: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          exercise_id?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          location: string | null
          max_participants: number | null
          teacher_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          teacher_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          teacher_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_portfolios: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          media_url: string | null
          teacher_id: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          media_url?: string | null
          teacher_id?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          media_url?: string | null
          teacher_id?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_portfolios_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_portfolios_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          bio: string | null
          bio_vi: string | null
          certifications: Json | null
          cover_image_url: string | null
          created_at: string
          display_name: string | null
          experience_years: number | null
          extra_data: Json | null
          headline: string | null
          hourly_rate: number | null
          id: string
          image_url: string | null
          intro_video_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          languages: Json | null
          location: string | null
          order_index: number | null
          rating: number | null
          slug: string | null
          social_links: Json | null
          specializations: Json | null
          total_hours: number | null
          total_lessons: number | null
          total_reviews: number | null
          total_students: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          bio_vi?: string | null
          certifications?: Json | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string | null
          experience_years?: number | null
          extra_data?: Json | null
          headline?: string | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          intro_video_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          languages?: Json | null
          location?: string | null
          order_index?: number | null
          rating?: number | null
          slug?: string | null
          social_links?: Json | null
          specializations?: Json | null
          total_hours?: number | null
          total_lessons?: number | null
          total_reviews?: number | null
          total_students?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          bio_vi?: string | null
          certifications?: Json | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string | null
          experience_years?: number | null
          extra_data?: Json | null
          headline?: string | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          intro_video_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          languages?: Json | null
          location?: string | null
          order_index?: number | null
          rating?: number | null
          slug?: string | null
          social_links?: Json | null
          specializations?: Json | null
          total_hours?: number | null
          total_lessons?: number | null
          total_reviews?: number | null
          total_students?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teacher_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_courses: {
        Row: {
          course_id: string
          enrolled_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_courses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string | null
          daily_goal: number | null
          daily_progress: number | null
          id: string
          last_activity_date: string | null
          lessons_completed: number | null
          streak: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
          vocabulary_mastered: number | null
        }
        Insert: {
          created_at?: string | null
          daily_goal?: number | null
          daily_progress?: number | null
          id?: string
          last_activity_date?: string | null
          lessons_completed?: number | null
          streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
          vocabulary_mastered?: number | null
        }
        Update: {
          created_at?: string | null
          daily_goal?: number | null
          daily_progress?: number | null
          id?: string
          last_activity_date?: string | null
          lessons_completed?: number | null
          streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
          vocabulary_mastered?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          audio_url: string | null
          category: string | null
          created_at: string | null
          example: string | null
          example_vi: string | null
          id: string
          language: string
          level: string
          meaning_vi: string
          pronunciation: string | null
          word: string
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          example?: string | null
          example_vi?: string | null
          id?: string
          language: string
          level: string
          meaning_vi: string
          pronunciation?: string | null
          word: string
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          example?: string | null
          example_vi?: string | null
          id?: string
          language?: string
          level?: string
          meaning_vi?: string
          pronunciation?: string | null
          word?: string
        }
        Relationships: []
      }
      website_content: {
        Row: {
          content: Json | null
          created_at: string
          description: string | null
          description_vi: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          order_index: number | null
          section_key: string
          subtitle: string | null
          subtitle_vi: string | null
          title: string | null
          title_vi: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          section_key: string
          subtitle?: string | null
          subtitle_vi?: string | null
          title?: string | null
          title_vi?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          section_key?: string
          subtitle?: string | null
          subtitle_vi?: string | null
          title?: string | null
          title_vi?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      teacher_public_view: {
        Row: {
          bio: string | null
          cover_image_url: string | null
          experience_years: number | null
          full_name: string | null
          headline: string | null
          id: string | null
          image_url: string | null
          rating: number | null
          slug: string | null
          total_reviews: number | null
          total_students: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_exercise_answers: {
        Args: { _exercise_id: string }
        Returns: {
          correct_answers: Json
          explanation: Json
        }[]
      }
      get_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          display_name: string
          initial: string
          lessons_completed: number
          rank: number
          streak: number
          total_xp: number
        }[]
      }
      get_lesson_exercises: {
        Args: { _lesson_id: string }
        Returns: {
          audio_url: string
          content: Json
          created_at: string
          exercise_type: string
          id: string
          instructions: string
          instructions_vi: string
          lesson_id: string
          order_index: number
          requires_grading: boolean
          title: string
          title_vi: string
          updated_at: string
        }[]
      }
      grade_exercise: {
        Args: { _answers: Json; _exercise_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_senior_teacher: { Args: { user_uuid: string }; Returns: boolean }
      is_teacher: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "teacher" | "senior_teacher"
      exam_type: "quiz" | "midterm" | "final" | "placement"
      leave_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "teacher", "senior_teacher"],
      exam_type: ["quiz", "midterm", "final", "placement"],
      leave_status: ["pending", "approved", "rejected"],
    },
  },
} as const
