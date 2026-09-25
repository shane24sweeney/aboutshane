import alcatel from '../assets/logos/Alcatel.png';
import ameritas from '../assets/logos/Ameritas.png';
import bottomline from '../assets/logos/Bottomline.png';
import bullhorn from '../assets/logos/Bullhorn.jpeg';
import celticTesting from '../assets/logos/CelticTesting.png';
import deluxe from '../assets/logos/Deluxe.png';
import fifthThirdBank from '../assets/logos/FifthThirdBank.png';
import fis from '../assets/logos/FIS.png';
import ge from '../assets/logos/GE.png';
import gpsTrackit from '../assets/logos/GPSTrackit.png';
import itron from '../assets/logos/Itron.png';
import motorola from '../assets/logos/Motorola.png';
import xm from '../assets/logos/XM.png';

export interface ResumeEntry {
  role: string;
  company: string;
  /** Staffing firm for contract roles. */
  contractVia?: string;
  logo: string;
  /** Location and dates for older roles that have no detailed write-up. */
  meta?: string;
  summary?: string;
  highlights: string[];
}

export const resume: ResumeEntry[] = [
  {
    role: 'Senior QE Consultant',
    company: 'Fifth Third Bank',
    contractVia: 'TEKsystems',
    logo: fifthThirdBank,
    summary:
      'Supported application modernization for a commercial banking client following the Comerica Bank acquisition, partnering with Agile squads across mobile and backend servicing domains.',
    highlights: [
      'Built integration, regression, and end-to-end testing frameworks, increasing automated test coverage from 45% to 80% across mobile and backend services.',
      'Automated identity management flows, backend APIs, and service integrations, reducing authentication-related defects by 30%.',
      'Used qTest, Perfecto, and Postman to manage test execution and cross-device validation across more than 300 test cases per release.',
      'Built TypeScript automation with WebdriverIO and the Page Object pattern, achieving 100% automated login-scenario coverage on iOS and Android smoke tests and reducing manual mobile regression time from 2 days to 4 hours.',
      'Used GitHub Copilot, Claude, and SonarQube to accelerate test script development by 40% and improve code quality.',
    ],
  },
  {
    role: 'Tech QA Manager',
    company: 'Ameritas',
    logo: ameritas,
    highlights: [
      'Designed automation frameworks in Java, Groovy (GEB/Spock), and Playwright, embedding BDD practices to enhance test reliability and long-term maintainability.',
      'Delivered advanced training sessions for senior engineers on new UI and API automation, improving technical expertise and overall efficiency within the automation team.',
      'Directed quality assurance strategies for UI, API, and Scale roadmap initiatives, ensuring comprehensive coverage and alignment with critical business and project objectives.',
      'Executed automation test runs through Jenkins and GitHub workflows, accelerating regression cycles while supporting streamlined continuous integration and delivery pipelines.',
      'Reviewed automated and manual test cases using IntelliJ, GitHub, Jira, and Xray, enforcing coding standards and improving collaboration across distributed teams.',
      'Reported automation outcomes during sprint demos to business stakeholders and utilized GitHub Copilot, reducing review effort and increasing delivery productivity.',
    ],
  },
  {
    role: 'Senior Automation Consultant',
    company: 'Ameritas',
    contractVia: 'TEKsystems',
    logo: ameritas,
    highlights: [
      'Engineered automation approaches for API, mobile, and web testing using Selenium, GEB, Groovy, and Spock, improving overall framework resilience and maintainability.',
      'Partnered with analysts and development teams to refine automation requirements, translating business needs into well-defined test stories and executable test cases.',
      'Performed scalability and reliability assessments with Postman, BlazeMeter, and Apache JMeter, ensuring application performance met organizational expectations under varying workloads.',
      'Strengthened test architecture by adding hard and soft assertions, DIAPER framework, and Entity framework, while establishing practices in both BDD and TDD.',
      'Mentored junior engineers with one-on-one guidance and knowledge sharing, while delivering QA demonstrations and reporting out automation outcomes to senior stakeholders.',
      'Spearheaded automation initiatives across all counties in all 50 U.S. states, including automated PDF validations, significantly improving nationwide regression reliability.',
    ],
  },
  {
    role: 'Senior Automation Consultant',
    company: 'FIS',
    contractVia: 'Eliassen Group',
    logo: fis,
    highlights: [
      'Built reusable automation frameworks in C# to support both API and UI testing, delivering consistent and reusable test architecture across projects.',
      'Conducted load and scalability evaluations using Postman and Apache JMeter, ensuring applications sustained performance benchmarks under high-demand conditions.',
      'Coached junior QA engineers through structured mentoring (one-on-one sessions) and documentation, promoting professional development and advancing team-wide automation capabilities.',
      'Organized automation backlogs, defining priorities and creating structured plans to align automation initiatives with sprint and release objectives.',
      'Blended API and UI automation suites into end-to-end testing processes, expanding regression coverage and improving overall system validation.',
      'Showcased automation progress and results in scrum ceremonies and QA demos, strengthening transparency and engagement with senior leadership.',
    ],
  },
  {
    role: 'Software Developer',
    company: 'GPS Trackit',
    logo: gpsTrackit,
    highlights: [
      'Enhanced the GPS Trackit product line by developing and maintaining features with Redux and Saga, leveraging VS Code and Chrome DevTools.',
      'Integrated RESTful APIs into core product modules, expanding functionality and improving system interoperability across applications.',
      'Championed the design and implementation of a company-wide TDD automation framework, strengthening test reliability and maintainability.',
      'Applied Page Object and Page Factory design patterns to automation architecture, improving reusability and reducing maintenance overhead.',
      'Utilized Java, IntelliJ, and diverse development tools to deliver scalable solutions and ensure consistent performance across the product suite.',
    ],
  },
  {
    role: 'Senior Automation Engineer',
    company: 'Deluxe',
    logo: deluxe,
    highlights: [
      'Architected and utilized design patterns to create a new automation framework for DELUXE banking product lines.',
      'Programmed in Java/C# and Python Robot frameworks.',
      'Performed both API and UI automation on Business Mobile utilizing Python Robot and Java.',
      'Implemented Fluent and Dependency Injection design patterns in multiple automation frameworks for both iOS and Android applications.',
    ],
  },
  {
    role: 'Senior Automation Consultant',
    company: 'Celtic Testing',
    logo: celticTesting,
    highlights: [
      "Responsible for automating Aaron's department store in C#.",
      'Developed multiple TDD projects for new CTE clients in Java and Selenium.',
      'Integrated automated testing into CI/CD pipeline in E-commerce.',
    ],
  },
  {
    role: 'Senior Automation Engineer',
    company: 'Bottomline',
    logo: bottomline,
    summary: 'Senior Test Automation Engineer for all Bottomline Healthcare product lines.',
    highlights: [
      'Architected the first Java Selenium WebDriver Test Driven Development (TDD) automation framework, utilizing design patterns and best practices.',
      'Developed Windows automation using Java Selenium to automate the .NET Windows Logical Ink Designer application in C#.',
      'Developed automation scripts with JMeter for scalability testing of the REST API interface within Logical Ink Web.',
    ],
  },
  {
    role: 'Automation Engineer',
    company: 'Bullhorn / PeopleNet',
    logo: bullhorn,
    summary: 'Lead Java Automation Engineer for all PeopleNet product lines.',
    highlights: [
      'Architected and designed the first Java Selenium automation framework in Bullhorn.',
      'Developed the first innovative automation framework for PeopleNet Time entry.',
    ],
  },
  {
    role: 'Lead Engineer Technologist',
    company: 'GE',
    logo: ge,
    summary: 'Lead Engineer for all AMI meter products in both IEC and ANSI meter products.',
    highlights: [
      'Responsible for managing and mentoring other employees within Digital meters.',
      'Developed the first automation framework for meters.',
      'Developed and executed software test plans, test designs, test objectives, and test cases.',
    ],
  },
  {
    role: 'SQA Engineer II',
    company: 'Itron',
    logo: itron,
    meta: 'Raleigh, NC (2008-2009)',
    highlights: [],
  },
  {
    role: 'Member of Technical Staff',
    company: 'XM Satellite Radio',
    logo: xm,
    meta: 'Deerfield Beach, FL (2004-2008)',
    highlights: [],
  },
  {
    role: 'Senior Software Engineer',
    company: 'Motorola',
    logo: motorola,
    meta: 'Boynton Beach, FL (2001-2004)',
    highlights: [],
  },
  {
    role: 'Network Subsystem Test',
    company: 'Alcatel',
    logo: alcatel,
    meta: 'Cork, Ireland (1999-2000)',
    highlights: [],
  },
];
