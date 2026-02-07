export interface OnboardingStep {
  target: string; // data-tour attribute value
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  position: "bottom" | "right" | "left" | "top";
}

export const adminSteps: OnboardingStep[] = [
  {
    target: "dashboard",
    titleFr: "Tableau de bord",
    titleEn: "Dashboard",
    descriptionFr: "Vue d'ensemble de votre etablissement : statistiques, activite recente et indicateurs cles.",
    descriptionEn: "Overview of your school: statistics, recent activity and key indicators.",
    position: "right",
  },
  {
    target: "students",
    titleFr: "Gestion des eleves",
    titleEn: "Student Management",
    descriptionFr: "Ajoutez, modifiez et suivez tous vos eleves. Consultez leurs profils et historiques.",
    descriptionEn: "Add, edit and track all your students. View their profiles and history.",
    position: "right",
  },
  {
    target: "presences",
    titleFr: "Presences",
    titleEn: "Attendance",
    descriptionFr: "Suivez les presences quotidiennes. Faites l'appel et consultez l'historique.",
    descriptionEn: "Track daily attendance. Take roll call and view history.",
    position: "right",
  },
  {
    target: "payments",
    titleFr: "Paiements",
    titleEn: "Payments",
    descriptionFr: "Gerez les paiements des eleves. Suivez les echeances et les soldes.",
    descriptionEn: "Manage student payments. Track due dates and balances.",
    position: "right",
  },
  {
    target: "messages",
    titleFr: "Messages",
    titleEn: "Messages",
    descriptionFr: "Communiquez avec les professeurs et l'equipe. Envoyez des messages prives ou groupes.",
    descriptionEn: "Communicate with teachers and staff. Send private or group messages.",
    position: "right",
  },
  {
    target: "users",
    titleFr: "Utilisateurs",
    titleEn: "Users",
    descriptionFr: "Gerez les comptes utilisateurs : admins, gestionnaires et professeurs.",
    descriptionEn: "Manage user accounts: admins, managers and teachers.",
    position: "right",
  },
  {
    target: "profile-btn",
    titleFr: "Mon profil",
    titleEn: "My Profile",
    descriptionFr: "Modifiez vos informations personnelles et changez votre mot de passe.",
    descriptionEn: "Edit your personal information and change your password.",
    position: "top",
  },
];

export const profSteps: OnboardingStep[] = [
  {
    target: "presences",
    titleFr: "Presences",
    titleEn: "Attendance",
    descriptionFr: "Faites l'appel de vos classes et consultez l'historique des presences.",
    descriptionEn: "Take attendance for your classes and view attendance history.",
    position: "right",
  },
  {
    target: "textbook",
    titleFr: "Cahier de texte",
    titleEn: "Textbook",
    descriptionFr: "Redigez et consultez le cahier de texte de vos cours.",
    descriptionEn: "Write and view the textbook for your classes.",
    position: "right",
  },
  {
    target: "messages",
    titleFr: "Messages",
    titleEn: "Messages",
    descriptionFr: "Echangez avec les administrateurs et les autres membres de l'equipe.",
    descriptionEn: "Communicate with administrators and other staff members.",
    position: "right",
  },
  {
    target: "profile-btn",
    titleFr: "Mon profil",
    titleEn: "My Profile",
    descriptionFr: "Modifiez vos informations et changez votre mot de passe.",
    descriptionEn: "Edit your information and change your password.",
    position: "top",
  },
];

export function getStepsForRole(role: string): OnboardingStep[] {
  if (role === "admin" || role === "gestionnaire") return adminSteps;
  if (role === "prof") return profSteps;
  return [];
}
