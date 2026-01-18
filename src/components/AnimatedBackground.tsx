export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Primary orb */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 dark:opacity-20 animate-orb-1"
        style={{
          background: 'hsl(var(--primary))',
          top: '10%',
          left: '20%',
        }}
      />
      
      {/* Secondary orb */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-25 dark:opacity-15 animate-orb-2"
        style={{
          background: 'hsl(var(--accent))',
          bottom: '20%',
          right: '15%',
        }}
      />
      
      {/* Tertiary orb */}
      <div 
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-20 dark:opacity-10 animate-orb-3"
        style={{
          background: 'hsl(var(--secondary))',
          top: '50%',
          left: '60%',
        }}
      />
      
      {/* Mesh gradient overlay */}
      <div 
        className="absolute inset-0 opacity-50 dark:opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 20% 80%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, hsl(var(--accent) / 0.1) 0%, transparent 50%)
          `
        }}
      />
    </div>
  );
}
