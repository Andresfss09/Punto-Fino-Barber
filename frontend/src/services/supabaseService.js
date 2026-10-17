import { supabase, isSupabaseConfigured } from './supabaseClient';

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const supabaseService = {
  async getServices() {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('order_num', { ascending: true });
    if (error) throw error;
    return (data || []).map((s) => ({
      ...s,
      _id: s.id,
    }));
  },

  async getBarbers() {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('is_available', true);
    if (error) throw error;
    return (data || []).map((b) => ({
      _id: b.id,
      name: b.name,
      user: {
        _id: b.profile_id || b.id,
        name: b.name,
        email: b.email,
      },
      bio: b.bio,
      isAvailable: b.is_available,
    }));
  },

  async createAppointment(appointmentData) {
    if (!isSupabaseConfigured()) return null;

    const confirmationCode = 'PF-' + Math.floor(1000 + Math.random() * 9000);

    const newAppointment = {
      confirmation_code: confirmationCode,
      client_name: appointmentData.clientName || 'Cliente',
      client_email: appointmentData.clientEmail || '',
      client_address: appointmentData.clientAddress || 'Cali',
      is_guest: !appointmentData.clientId,
      client_id: isUUID(appointmentData.clientId) ? appointmentData.clientId : null,
      barber_id: isUUID(appointmentData.barberId) ? appointmentData.barberId : null,
      date: appointmentData.date,
      start_time: appointmentData.startTime,
      end_time: appointmentData.endTime || appointmentData.startTime,
      total_price: Number(appointmentData.totalPrice) || 0,
      total_duration: Number(appointmentData.totalDuration) || 35,
      status: 'pendiente',
      payment_method: appointmentData.paymentMethod || 'efectivo',
      notes: appointmentData.notes || '',
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(newAppointment)
      .select()
      .single();

    if (error) throw error;

    return {
      appointment: {
        ...data,
        _id: data.id,
        confirmationCode: data.confirmation_code,
      },
      confirmationCode: data.confirmation_code,
    };
  },

  async getBarberAppointments(barberId, date) {
    if (!isSupabaseConfigured()) return null;

    let query = supabase
      .from('appointments')
      .select('*, appointment_services(*)');

    if (barberId) query = query.eq('barber_id', barberId);
    if (date) query = query.eq('date', date);

    const { data, error } = await query.order('start_time', { ascending: true });
    if (error) throw error;

    return (data || []).map((apt) => ({
      ...apt,
      _id: apt.id,
      client: {
        name: apt.client_name,
        email: apt.client_email,
      },
      services: (apt.appointment_services || []).map((as) => ({
        name: as.service_name,
        price: as.price,
        duration: as.duration,
      })),
      totalDuration: apt.total_duration,
      totalPrice: apt.total_price,
      startTime: apt.start_time,
      status: apt.status,
      paymentMethod: apt.payment_method,
    }));
  },

  async updateAppointmentStatus(appointmentId, status) {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async login(email, password) {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: {
        _id: data.user.id,
        name: profile?.name || data.user.user_metadata?.name || 'Usuario',
        email: data.user.email,
        role: profile?.role || data.user.user_metadata?.role || 'BARBER',
      },
      token: data.session.access_token,
    };
  },

  async register({ name, email, password, role = 'BARBER' }) {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });
    if (error) throw error;

    return {
      user: {
        _id: data.user?.id,
        name,
        email,
        role,
      },
      token: data.session?.access_token || '',
    };
  },

  async logout() {
    if (!isSupabaseConfigured()) return;
    await supabase.auth.signOut();
  },
};
