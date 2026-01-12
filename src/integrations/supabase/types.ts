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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_evaluations: {
        Row: {
          created_at: string
          evaluation_data: Json
          evaluation_type: string
          expires_at: string
          id: string
          university_id: string
        }
        Insert: {
          created_at?: string
          evaluation_data: Json
          evaluation_type: string
          expires_at?: string
          id?: string
          university_id: string
        }
        Update: {
          created_at?: string
          evaluation_data?: Json
          evaluation_type?: string
          expires_at?: string
          id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_evaluations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      country_document_rules: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          document_name: string
          education_system: string | null
          how_to_obtain: string | null
          id: string
          notes: string | null
          specific_requirements: string | null
          stamps_required: string[] | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          document_name: string
          education_system?: string | null
          how_to_obtain?: string | null
          id?: string
          notes?: string | null
          specific_requirements?: string | null
          stamps_required?: string[] | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          document_name?: string
          education_system?: string | null
          how_to_obtain?: string | null
          id?: string
          notes?: string | null
          specific_requirements?: string | null
          stamps_required?: string[] | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          course_code: string
          course_name: string
          created_at: string
          credits: number
          department: string | null
          description: string | null
          ects_credits: number | null
          id: string
          language: string | null
          level: string | null
          university_id: string
        }
        Insert: {
          course_code: string
          course_name: string
          created_at?: string
          credits?: number
          department?: string | null
          description?: string | null
          ects_credits?: number | null
          id?: string
          language?: string | null
          level?: string | null
          university_id: string
        }
        Update: {
          course_code?: string
          course_name?: string
          created_at?: string
          credits?: number
          department?: string | null
          description?: string | null
          ects_credits?: number | null
          id?: string
          language?: string | null
          level?: string | null
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          faculty_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          faculty_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          faculty_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requirement_templates: {
        Row: {
          created_at: string
          description: string | null
          document_category: string
          document_name: string
          id: string
          is_required: boolean | null
          sort_order: number | null
          stage_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_category: string
          document_name: string
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          stage_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_category?: string
          document_name?: string
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          stage_type?: string
        }
        Relationships: []
      }
      faculties: {
        Row: {
          created_at: string
          id: string
          name: string
          university_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          university_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculties_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_exchanges: {
        Row: {
          created_at: string
          department: string | null
          end_date: string | null
          exchange_type: string
          faculty_email: string | null
          faculty_name: string
          host_university_id: string
          id: string
          outcomes: string | null
          purpose: string | null
          start_date: string | null
          status: string
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          end_date?: string | null
          exchange_type: string
          faculty_email?: string | null
          faculty_name: string
          host_university_id: string
          id?: string
          outcomes?: string | null
          purpose?: string | null
          start_date?: string | null
          status?: string
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          end_date?: string | null
          exchange_type?: string
          faculty_email?: string | null
          faculty_name?: string
          host_university_id?: string
          id?: string
          outcomes?: string | null
          purpose?: string | null
          start_date?: string | null
          status?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_exchanges_host_university_id_fkey"
            columns: ["host_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_exchanges_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_agreements: {
        Row: {
          application_id: string | null
          approved_at: string | null
          approved_by: string | null
          course_mappings: Json | null
          created_at: string
          home_courses: Json | null
          host_courses: Json | null
          id: string
          notes: string | null
          status: string
          total_ects: number | null
          total_home_credits: number | null
          total_host_credits: number | null
          transcript_data: Json | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          course_mappings?: Json | null
          created_at?: string
          home_courses?: Json | null
          host_courses?: Json | null
          id?: string
          notes?: string | null
          status?: string
          total_ects?: number | null
          total_home_credits?: number | null
          total_host_credits?: number | null
          transcript_data?: Json | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          course_mappings?: Json | null
          created_at?: string
          home_courses?: Json | null
          host_courses?: Json | null
          id?: string
          notes?: string | null
          status?: string
          total_ects?: number | null
          total_home_credits?: number | null
          total_host_credits?: number | null
          transcript_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_agreements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "student_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      mobility_records: {
        Row: {
          academic_year: string
          completion_status: string
          created_at: string
          department_id: string
          direction: string
          id: string
          partner_university_id: string
          program_type: string
          student_count: number
          university_id: string
        }
        Insert: {
          academic_year: string
          completion_status?: string
          created_at?: string
          department_id: string
          direction: string
          id?: string
          partner_university_id: string
          program_type: string
          student_count?: number
          university_id: string
        }
        Update: {
          academic_year?: string
          completion_status?: string
          created_at?: string
          department_id?: string
          direction?: string
          id?: string
          partner_university_id?: string
          program_type?: string
          student_count?: number
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobility_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobility_records_partner_university_id_fkey"
            columns: ["partner_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobility_records_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      mobility_tasks: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          document_name: string | null
          document_url: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          phase: string
          requires_document: boolean | null
          sort_order: number
          task_name: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          document_name?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          phase: string
          requires_document?: boolean | null
          sort_order?: number
          task_name: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          document_name?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          phase?: string
          requires_document?: boolean | null
          sort_order?: number
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobility_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "student_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      mou_history: {
        Row: {
          action: string
          actor_university_id: string
          changes: Json | null
          created_at: string
          id: string
          mou_id: string
        }
        Insert: {
          action: string
          actor_university_id: string
          changes?: Json | null
          created_at?: string
          id?: string
          mou_id: string
        }
        Update: {
          action?: string
          actor_university_id?: string
          changes?: Json | null
          created_at?: string
          id?: string
          mou_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mou_history_actor_university_id_fkey"
            columns: ["actor_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mou_history_mou_id_fkey"
            columns: ["mou_id"]
            isOneToOne: false
            referencedRelation: "mous"
            referencedColumns: ["id"]
          },
        ]
      }
      mous: {
        Row: {
          clauses: Json
          cooperation_scope: string[]
          created_at: string
          id: string
          initiator_university_id: string
          partner_university_id: string
          status: string
          updated_at: string
        }
        Insert: {
          clauses?: Json
          cooperation_scope?: string[]
          created_at?: string
          id?: string
          initiator_university_id: string
          partner_university_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          clauses?: Json
          cooperation_scope?: string[]
          created_at?: string
          id?: string
          initiator_university_id?: string
          partner_university_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mous_initiator_university_id_fkey"
            columns: ["initiator_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mous_partner_university_id_fkey"
            columns: ["partner_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_messages: {
        Row: {
          created_at: string
          from_university_id: string
          id: string
          is_read: boolean
          message: string
          message_type: string
          subject: string
          to_university_id: string
        }
        Insert: {
          created_at?: string
          from_university_id: string
          id?: string
          is_read?: boolean
          message: string
          message_type?: string
          subject: string
          to_university_id: string
        }
        Update: {
          created_at?: string
          from_university_id?: string
          id?: string
          is_read?: boolean
          message?: string
          message_type?: string
          subject?: string
          to_university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_messages_from_university_id_fkey"
            columns: ["from_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_messages_to_university_id_fkey"
            columns: ["to_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_projects: {
        Row: {
          budget_usd: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          partner_university_id: string
          progress: number
          project_name: string
          project_type: string
          start_date: string | null
          status: string
          university_id: string
          updated_at: string
        }
        Insert: {
          budget_usd?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          partner_university_id: string
          progress?: number
          project_name: string
          project_type: string
          start_date?: string | null
          status?: string
          university_id: string
          updated_at?: string
        }
        Update: {
          budget_usd?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          partner_university_id?: string
          progress?: number
          project_name?: string
          project_type?: string
          start_date?: string | null
          status?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_projects_partner_university_id_fkey"
            columns: ["partner_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_projects_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_requests: {
        Row: {
          created_at: string
          from_university_id: string
          id: string
          message: string
          priority: string
          request_type: string
          responded_at: string | null
          status: string
          subject: string
          to_university_id: string
        }
        Insert: {
          created_at?: string
          from_university_id: string
          id?: string
          message: string
          priority?: string
          request_type?: string
          responded_at?: string | null
          status?: string
          subject: string
          to_university_id: string
        }
        Update: {
          created_at?: string
          from_university_id?: string
          id?: string
          message?: string
          priority?: string
          request_type?: string
          responded_at?: string | null
          status?: string
          subject?: string
          to_university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_requests_from_university_id_fkey"
            columns: ["from_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_requests_to_university_id_fkey"
            columns: ["to_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_roi: {
        Row: {
          created_at: string
          grant_funding_usd: number | null
          id: string
          joint_publications: number | null
          partner_university_id: string
          partnership_year: number
          research_collaborations: number | null
          satisfaction_score: number | null
          student_exchange_count: number | null
          university_id: string
        }
        Insert: {
          created_at?: string
          grant_funding_usd?: number | null
          id?: string
          joint_publications?: number | null
          partner_university_id: string
          partnership_year: number
          research_collaborations?: number | null
          satisfaction_score?: number | null
          student_exchange_count?: number | null
          university_id: string
        }
        Update: {
          created_at?: string
          grant_funding_usd?: number | null
          id?: string
          joint_publications?: number | null
          partner_university_id?: string
          partnership_year?: number
          research_collaborations?: number | null
          satisfaction_score?: number | null
          student_exchange_count?: number | null
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_roi_partner_university_id_fkey"
            columns: ["partner_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_roi_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      research_collaborations: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          funding_amount: number | null
          funding_source: string | null
          id: string
          partner_investigator: string | null
          partner_university_id: string
          principal_investigator: string | null
          project_title: string
          publications_count: number | null
          research_area: string | null
          start_date: string | null
          status: string
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          funding_amount?: number | null
          funding_source?: string | null
          id?: string
          partner_investigator?: string | null
          partner_university_id: string
          principal_investigator?: string | null
          project_title: string
          publications_count?: number | null
          research_area?: string | null
          start_date?: string | null
          status?: string
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          funding_amount?: number | null
          funding_source?: string | null
          id?: string
          partner_investigator?: string | null
          partner_university_id?: string
          principal_investigator?: string | null
          project_title?: string
          publications_count?: number | null
          research_area?: string | null
          start_date?: string | null
          status?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_collaborations_partner_university_id_fkey"
            columns: ["partner_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_collaborations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      student_applications: {
        Row: {
          academic_year: string
          application_date: string
          created_at: string
          end_date: string | null
          host_university_id: string
          id: string
          notes: string | null
          program_type: string
          semester: string
          start_date: string | null
          status: string
          student_email: string
          student_id_number: string | null
          student_name: string
          university_id: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          application_date?: string
          created_at?: string
          end_date?: string | null
          host_university_id: string
          id?: string
          notes?: string | null
          program_type: string
          semester: string
          start_date?: string | null
          status?: string
          student_email: string
          student_id_number?: string | null
          student_name: string
          university_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          application_date?: string
          created_at?: string
          end_date?: string | null
          host_university_id?: string
          id?: string
          notes?: string | null
          program_type?: string
          semester?: string
          start_date?: string | null
          status?: string
          student_email?: string
          student_id_number?: string | null
          student_name?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_applications_host_university_id_fkey"
            columns: ["host_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_applications_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      student_document_items: {
        Row: {
          created_at: string
          document_category: string
          document_name: string
          document_url: string | null
          id: string
          stamps_verified: string[] | null
          status: string
          student_document_id: string
          updated_at: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_category: string
          document_name: string
          document_url?: string | null
          id?: string
          stamps_verified?: string[] | null
          status?: string
          student_document_id: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_category?: string
          document_name?: string
          document_url?: string | null
          id?: string
          stamps_verified?: string[] | null
          status?: string
          student_document_id?: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_document_items_student_document_id_fkey"
            columns: ["student_document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          country_of_origin: string
          created_at: string
          degree_level: string
          education_system: string | null
          id: string
          notes: string | null
          stage: string
          status: string
          student_email: string | null
          student_id_number: string | null
          student_name: string
          university_id: string
          updated_at: string
        }
        Insert: {
          country_of_origin: string
          created_at?: string
          degree_level: string
          education_system?: string | null
          id?: string
          notes?: string | null
          stage: string
          status?: string
          student_email?: string | null
          student_id_number?: string | null
          student_name: string
          university_id: string
          updated_at?: string
        }
        Update: {
          country_of_origin?: string
          created_at?: string
          degree_level?: string
          education_system?: string | null
          id?: string
          notes?: string | null
          stage?: string
          status?: string
          student_email?: string | null
          student_id_number?: string | null
          student_name?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          accreditations: string[] | null
          country: string
          created_at: string
          educational_union: string | null
          founded_year: number | null
          id: string
          internationalization_maturity: string
          journals: string[] | null
          name: string
          ranking: number | null
          region: string
          research_strengths: string[] | null
          size: string
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          accreditations?: string[] | null
          country: string
          created_at?: string
          educational_union?: string | null
          founded_year?: number | null
          id?: string
          internationalization_maturity: string
          journals?: string[] | null
          name: string
          ranking?: number | null
          region: string
          research_strengths?: string[] | null
          size: string
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          accreditations?: string[] | null
          country?: string
          created_at?: string
          educational_union?: string | null
          founded_year?: number | null
          id?: string
          internationalization_maturity?: string
          journals?: string[] | null
          name?: string
          ranking?: number | null
          region?: string
          research_strengths?: string[] | null
          size?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      university_profiles: {
        Row: {
          alumni_footprint: string | null
          collaboration_channels: string[] | null
          collaboration_interests: string[] | null
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          created_at: string
          credit_transfer_system: string | null
          cultural_diplomacy_focus: string | null
          data_reporting_standards: string[] | null
          degree_recognition: string | null
          digital_management_systems: string[] | null
          discipline_focus_areas: string[] | null
          erasmus_eligibility: string[] | null
          exchange_programs: string[] | null
          faculty_exchange_policies: string | null
          global_summit_participation: string[] | null
          has_dedicated_io: boolean | null
          has_english_speaking_staff: boolean | null
          has_grant_management: boolean | null
          horizon_europe_eligible: boolean | null
          id: string
          international_research_projects: string[] | null
          internship_frameworks: string[] | null
          io_manager_1_email: string | null
          io_manager_1_name: string
          io_manager_1_phone: string | null
          io_manager_2_email: string | null
          io_manager_2_name: string | null
          io_manager_2_phone: string | null
          io_manager_3_email: string | null
          io_manager_3_name: string | null
          io_manager_3_phone: string | null
          io_manager_4_email: string | null
          io_manager_4_name: string | null
          io_manager_4_phone: string | null
          io_manager_5_email: string | null
          io_manager_5_name: string | null
          io_manager_5_phone: string | null
          joint_degrees: string[] | null
          languages_of_instruction: string[] | null
          memberships: string[] | null
          publication_metrics: string | null
          regional_development_goals: string | null
          research_specializations: string[] | null
          sdg_alignment: string[] | null
          social_media_presence: string | null
          soft_power_alignment: string[] | null
          student_satisfaction_score: number | null
          target_regions: string[] | null
          university_id: string
          university_photos: string[] | null
          updated_at: string
          visa_housing_assistance: boolean | null
        }
        Insert: {
          alumni_footprint?: string | null
          collaboration_channels?: string[] | null
          collaboration_interests?: string[] | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          credit_transfer_system?: string | null
          cultural_diplomacy_focus?: string | null
          data_reporting_standards?: string[] | null
          degree_recognition?: string | null
          digital_management_systems?: string[] | null
          discipline_focus_areas?: string[] | null
          erasmus_eligibility?: string[] | null
          exchange_programs?: string[] | null
          faculty_exchange_policies?: string | null
          global_summit_participation?: string[] | null
          has_dedicated_io?: boolean | null
          has_english_speaking_staff?: boolean | null
          has_grant_management?: boolean | null
          horizon_europe_eligible?: boolean | null
          id?: string
          international_research_projects?: string[] | null
          internship_frameworks?: string[] | null
          io_manager_1_email?: string | null
          io_manager_1_name: string
          io_manager_1_phone?: string | null
          io_manager_2_email?: string | null
          io_manager_2_name?: string | null
          io_manager_2_phone?: string | null
          io_manager_3_email?: string | null
          io_manager_3_name?: string | null
          io_manager_3_phone?: string | null
          io_manager_4_email?: string | null
          io_manager_4_name?: string | null
          io_manager_4_phone?: string | null
          io_manager_5_email?: string | null
          io_manager_5_name?: string | null
          io_manager_5_phone?: string | null
          joint_degrees?: string[] | null
          languages_of_instruction?: string[] | null
          memberships?: string[] | null
          publication_metrics?: string | null
          regional_development_goals?: string | null
          research_specializations?: string[] | null
          sdg_alignment?: string[] | null
          social_media_presence?: string | null
          soft_power_alignment?: string[] | null
          student_satisfaction_score?: number | null
          target_regions?: string[] | null
          university_id: string
          university_photos?: string[] | null
          updated_at?: string
          visa_housing_assistance?: boolean | null
        }
        Update: {
          alumni_footprint?: string | null
          collaboration_channels?: string[] | null
          collaboration_interests?: string[] | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          credit_transfer_system?: string | null
          cultural_diplomacy_focus?: string | null
          data_reporting_standards?: string[] | null
          degree_recognition?: string | null
          digital_management_systems?: string[] | null
          discipline_focus_areas?: string[] | null
          erasmus_eligibility?: string[] | null
          exchange_programs?: string[] | null
          faculty_exchange_policies?: string | null
          global_summit_participation?: string[] | null
          has_dedicated_io?: boolean | null
          has_english_speaking_staff?: boolean | null
          has_grant_management?: boolean | null
          horizon_europe_eligible?: boolean | null
          id?: string
          international_research_projects?: string[] | null
          internship_frameworks?: string[] | null
          io_manager_1_email?: string | null
          io_manager_1_name?: string
          io_manager_1_phone?: string | null
          io_manager_2_email?: string | null
          io_manager_2_name?: string | null
          io_manager_2_phone?: string | null
          io_manager_3_email?: string | null
          io_manager_3_name?: string | null
          io_manager_3_phone?: string | null
          io_manager_4_email?: string | null
          io_manager_4_name?: string | null
          io_manager_4_phone?: string | null
          io_manager_5_email?: string | null
          io_manager_5_name?: string | null
          io_manager_5_phone?: string | null
          joint_degrees?: string[] | null
          languages_of_instruction?: string[] | null
          memberships?: string[] | null
          publication_metrics?: string | null
          regional_development_goals?: string | null
          research_specializations?: string[] | null
          sdg_alignment?: string[] | null
          social_media_presence?: string | null
          soft_power_alignment?: string[] | null
          student_satisfaction_score?: number | null
          target_regions?: string[] | null
          university_id?: string
          university_photos?: string[] | null
          updated_at?: string
          visa_housing_assistance?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "university_profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: true
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
