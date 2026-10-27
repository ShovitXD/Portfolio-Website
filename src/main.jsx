import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './rubber-material.css';
import ControllerPanel from './ControllerPanel';
import RubberHeader from './RubberHeader';
import SkillFilters from './SkillFilters';

const skills = [ ['C#', 'Code'], ['C++', 'Code'], ['Unity', 'Engines'], ['Unreal', 'Engines'], ['Substance Painter', 'Art & design'], ['Marvelous Designer', 'Art & design'], ['Maya', 'Art & design'], ['Python', 'Code'], ['.NET', 'Code'] ];
function App() {
  const [filter, setFilter] = useState('All');

  return <>
    <RubberHeader />
    <main>
      <section id="about" aria-label="About me"><div className="hero" id="home">
        <div className="hero-copy"><p className="eyebrow"><span className="status-dot"/> UNITY DEVELOPER · GAME MAKER</p><h1>Shovit Naik<span className="orange">.</span></h1><p className="hero-statement">Turning ideas into<br/><span>playable worlds.</span></p><p className="intro">From educational games to immersive VR environments. I bring code, design, and a little curiosity together to build interactive experiences.</p><div className="current"><span className="tiny-cross">+</span><div>Currently building at<strong>Prudent Global Tech <span>↗</span></strong></div></div></div>
        <ControllerPanel />
      </div>
      <aside className="about about-introduction"><span className="about-symbol">✳</span><p className="eyebrow">THE PERSON BEHIND THE PIXELS</p><h2>A developer’s mind.<br/>A designer’s eye.</h2><p>My work sits where programming meets design: building games, shaping virtual environments, and making ideas interactive.</p><span className="signature">Shovit Naik<span className="orange">.</span></span></aside>
      <div className="discipline-strip"><span>GAME DEVELOPMENT</span><i>✳</i><span>VIRTUAL REALITY</span><i>✳</i><span>INTERACTIVE EXPERIENCES</span><i>✳</i><span>3D WORLDS</span></div></section>
      <section id="experience" className="section"><div className="section-heading"><div><p className="eyebrow">01 / THE JOURNEY</p><h2>Experience that<br/>goes beyond the screen<span className="orange">.</span></h2></div><p>A blend of programming, gameplay,<br/>and world-building.</p></div>
        <div className="experience-list">
          <article className="experience featured"><div className="job-number">01</div><div className="job-content"><div className="job-top"><p className="company">Prudent Global Tech</p><span className="badge"><span className="status-dot"/> CURRENT ROLE</span></div><h3>Unity Twin Developer</h3><div className="job-tags"><span>Unity</span><span>Development</span></div></div><span className="duration">Ongoing</span></article>
          <article className="experience"><div className="job-number">02</div><div className="job-content"><div className="job-top"><p className="company">Vizuara</p><span className="internship">INTERNSHIP</span></div><h3>Game Designer & Developer</h3><p className="job-description">Designed and developed educational mini-games, bringing learning to life through play.</p><div className="job-tags"><span>Game design</span><span>Development</span><span>Education</span></div></div><span className="duration">4 months</span></article>
          <article className="experience"><div className="job-number">03</div><div className="job-content"><div className="job-top"><p className="company">YouthBuzzEducome</p><span className="internship">INTERNSHIP</span></div><h3>VR Environment & Gameplay Designer</h3><p className="job-description">Created real-world photogrammetry environments for VR exploration and designed the mechanics to explore them.</p><div className="job-tags"><span>Virtual reality</span><span>Photogrammetry</span><span>Gameplay</span></div></div><span className="duration">1 month</span></article>
        </div>
      </section>
      <section id="toolkit" className="section toolkit"><div className="section-heading"><div><p className="eyebrow">02 / TOOLS OF THE TRADE</p><h2>The building blocks<span className="orange">.</span></h2></div><p>From the first line of code<br/>to the final layer of detail.</p></div><SkillFilters value={filter} onChange={setFilter} /><div className="skills-grid">{skills.filter(([, category]) => filter === 'All' || category === filter).map(([name, category]) => <div className="skill" key={name}><span className={'skill-icon ' + (category === 'Engines' ? 'blue' : '')}>{({'Unity':'◈','Unreal':'U','Substance Painter':'Sp','Marvelous Designer':'Md','Maya':'M','Python':'Py','.NET':'.n'})[name] || name}</span><div><h3>{name}</h3><p>{category}</p></div><span className="skill-plus">+</span></div>)}</div></section>
      <section id="education" className="section lower-section education-section"><div><p className="eyebrow">03 / THE FOUNDATION</p><h2>Learning to build<span className="orange">.</span></h2><div className="education-card"><span className="degree-icon">↗</span><div><p className="degree-level">MASTER’S DEGREE</p><h3>MSc. Game Programming</h3><p>Kingston University</p></div></div><div className="education-card"><span className="degree-icon">↗</span><div><p className="degree-level">BACHELOR’S DEGREE</p><h3>BSc. Game Design and Development</h3><p>Maysore University</p></div></div></div></section>
    </main><footer><a className="brand" href="#home">sn<span>.</span></a><p>Shovit Naik <span> / </span> Unity Developer</p><a href="#home">Back to top ↑</a></footer>
  </>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);





