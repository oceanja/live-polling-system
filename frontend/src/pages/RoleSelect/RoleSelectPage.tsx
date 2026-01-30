import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoleSelectPage() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selectedRole) return;

    // store role for whole app
    localStorage.setItem('role', selectedRole);

    // navigate based on role
    if (selectedRole === 'teacher') {
      navigate('/teacher/create');
    } else {
      navigate('/student/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F2F2F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>

        {/* Logo Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'linear-gradient(135deg, #7765DA 0%, #5767D0 100%)',
          color: 'white',
          padding: '0.5rem 1.25rem',
          borderRadius: '50px',
          fontSize: '0.95rem',
          fontWeight: '500',
          marginBottom: '3rem'
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>+</span>
          Intervue Poll
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '600',
          color: '#373737',
          marginBottom: '1rem',
          lineHeight: '1.2'
        }}>
          Welcome to the <span style={{ fontWeight: '700' }}>Live Polling System</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.1rem',
          color: '#6E6E6E',
          marginBottom: '3rem',
          maxWidth: '600px'
        }}>
          Please select the role that best describes you to begin using the live polling system
        </p>

        {/* Role Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          width: '100%',
          maxWidth: '800px',
          marginBottom: '3rem'
        }}>

          {/* Student Card */}
          <div
            onClick={() => setSelectedRole('student')}
            style={{
              background: selectedRole === 'student'
                ? 'linear-gradient(135deg, rgba(119, 101, 218, 0.05) 0%, rgba(87, 103, 208, 0.05) 100%)'
                : 'white',
              border: selectedRole === 'student'
                ? '3px solid #5767D0'
                : '2px solid #E5E5E5',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              transform: selectedRole === 'student' ? 'translateY(-2px)' : 'none',
              boxShadow: selectedRole === 'student'
                ? '0 4px 12px rgba(119, 101, 218, 0.15)'
                : 'none'
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#373737' }}>
              I'm a Student
            </h2>
            <p style={{ color: '#6E6E6E' }}>
              Lorem Ipsum is simply dummy text of the printing and typesetting industry
            </p>
          </div>

          {/* Teacher Card */}
          <div
            onClick={() => setSelectedRole('teacher')}
            style={{
              background: selectedRole === 'teacher'
                ? 'linear-gradient(135deg, rgba(119, 101, 218, 0.05) 0%, rgba(87, 103, 208, 0.05) 100%)'
                : 'white',
              border: selectedRole === 'teacher'
                ? '3px solid #5767D0'
                : '2px solid #E5E5E5',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              transform: selectedRole === 'teacher' ? 'translateY(-2px)' : 'none',
              boxShadow: selectedRole === 'teacher'
                ? '0 4px 12px rgba(119, 101, 218, 0.15)'
                : 'none'
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#373737' }}>
              I'm a Teacher
            </h2>
            <p style={{ color: '#6E6E6E' }}>
              Submit answers and view live poll results in real-time.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          style={{
            background: selectedRole
              ? 'linear-gradient(135deg, #7765DA 0%, #5767D0 100%)'
              : 'rgba(119, 101, 218, 0.6)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '1rem 3rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: selectedRole ? 'pointer' : 'not-allowed',
            opacity: selectedRole ? 1 : 0.6
          }}
        >
          Continue
        </button>

      </div>
    </div>
  );
}
