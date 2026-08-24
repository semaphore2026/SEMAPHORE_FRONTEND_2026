import React from 'react'

const rules = [
  'Participants must report to the venue on time and be present before their respective event begins.',
  'Participants must carry their required equipment and materials as specified by the event coordinators.',
  'Electronic gadgets are not allowed in events where they are specifically prohibited by the event rules.',
  'All participants must maintain discipline and professional behaviour throughout the fest and respect fellow participants, volunteers, and judges.',
  'Cheating, unfair practices, hacking, or any form of malpractice will result in immediate disqualification.',
  'Participants must follow the instructions given by the event coordinators and judges during every round without disrupting the event.',
  'Vulgar, offensive, discriminatory, or disrespectful content or behaviour will not be permitted and may lead to disqualification.',
  'Participants cannot take part in multiple events simultaneously if the event schedules overlap or if the specific event prohibits participation elsewhere.',
  'The decision of the judges and event coordinators will be final and binding, and no disputes or objections regarding the results will be entertained.',
]

function Seal() {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23 3 L41 10 V22 C41 33 33 40 23 43 C13 40 5 33 5 22 V10 Z"
        stroke="#3a5a78"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M23 9 L35 14 V22 C35 30 29 35 23 37 C17 35 11 30 11 22 V14 Z"
        stroke="#3a5a78"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}

export default function App() {
  return (
    <div className="page">
      <div className="scroll">
        <div className="header">
          <h1 className="title">Semaphore 2K26</h1>

          <div className="divider">
            <span className="line" />
            <Seal />
            <span className="line" />
          </div>

          <h2 className="subtitle">Rules &amp; Regulations</h2>
          <p className="fest-tag">National Level MCA Tech Fest &middot; NMAMIT Nitte</p>
        </div>

        <ol className="rules-list">
          {rules.map((rule, i) => (
            <li key={i} className="rule-item">
              <span className="rule-number">{i + 1}.</span>
              <span className="rule-text">{rule}</span>
            </li>
          ))}
        </ol>

        <p className="footer">Given under the seal of the Organising Committee</p>
      </div>
    </div>
  )
}
