type NavbarProps = {
    currentView: string;
    onViewChange: (view: string) => void;
  };
  
  function Navbar(props: NavbarProps) {
    return (
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f0f0f0',
        padding: '15px 20px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '15px',
        zIndex: 1000 // Ensures navbar stays on top of other content
      }}>
        <button 
          onClick={() => props.onViewChange('dashboard')}
          style={{
            color: 'black',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Dashboard
        </button>
        
        <button 
          onClick={() => props.onViewChange('generate')}
          style={{
            color: 'black',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Generate Flashcards
        </button>
      </nav>
    );
  }
  
  export default Navbar;