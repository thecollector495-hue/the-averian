
export default function TermsOfServicePage() {
  return (
    <div>
      <h1>Terms of Service for The Averian</h1>

      <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using The Averian (the "Application"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use the Application.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        The Averian is an aviary management application designed to help users track information related to their birds, including but not limited to breeding records, finances, and personal notes. The features and services are provided "as is".
      </p>
      
      <h2>3. User Accounts</h2>
      <p>
        To access most features of the Application, you must register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
      </p>

      <h2>4. User Data and Responsibility</h2>
      <p>
        You are solely responsible for all data, information, and content that you upload, post, or otherwise transmit via the Application ("User Data"). You acknowledge and agree that:
      </p>
      <ul>
        <li>We are not responsible for any loss, corruption, or damage to your User Data. We strongly recommend that you maintain your own backups of your User Data.</li>
        <li>You are responsible for ensuring the accuracy and legality of your User Data.</li>
        <li>The Application is a tool for data management. It does not provide veterinary, financial, or legal advice. Decisions made based on data from the Application are your sole responsibility.</li>
      </ul>

      <h2>5. Disclaimer of Warranties and Limitation of Liability</h2>
      <p>
        THE APPLICATION IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE APPLICATION AND YOUR USE THEREOF.
      </p>
      <p>
        IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
      </p>
      <ul>
        <li><strong>LOSS OF PROFITS</strong> or revenue, whether incurred directly or indirectly.</li>
        <li><strong>LOSS OF BIRDS,</strong> livestock, or any other property.</li>
        <li><strong>DATA LOSS,</strong> corruption, or inaccuracy of data.</li>
        <li><strong>BUSINESS INTERRUPTION</strong> or any other commercial damages or losses, arising from your use of, or inability to use, the Application.</li>
      </ul>
      <p>
        Our liability to you for any cause whatsoever and regardless of the form of the action, will at all times be limited to the amount paid, if any, by you to us for the service during the term of membership.
      </p>

      <h2>6. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Application after any such changes constitutes your acceptance of the new Terms.
      </p>
      
      <h2>Contact Us</h2>
      <p>If you have any questions about these Terms, please contact us at: [Your Contact Email Address]</p>

      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ccc' }}>
        <p><em><strong>Disclaimer:</strong> This is a boilerplate Terms of Service agreement and may not be sufficient for your specific needs. It is highly recommended that you consult with a legal professional to ensure you are fully protected.</em></p>
      </div>
    </div>
  );
}
