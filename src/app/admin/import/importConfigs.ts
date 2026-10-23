export type ImportKind = "parents" | "staff" | "students";
export type RowValues = Record<string, string>;

export type RowOutcome = {
  status: "ok" | "skipped";
  message: string;
  /** Summary counters this row adds to, e.g. ["parents", "children"] */
  tally: string[];
};

export type ImportConfig = {
  templateFile: string;
  template: string;
  intro: string;
  columns: { name: string; when: string; note: string }[];
  notes: string[];
  /** Friendlier or older header names that mean the same column */
  aliases: Record<string, string>;
  /** Tidy a parsed row before use (e.g. split a combined contact column) */
  prepare?: (r: RowValues) => RowValues;
  /** A client-side check; returns an error message to skip the request */
  precheck?: (r: RowValues) => string | null;
  endpoint: string;
  toBody: (r: RowValues, schoolId: string) => Record<string, unknown>;
  /** API error field names -> CSV column names */
  fieldToColumn: Record<string, string>;
  interpret: (data: any) => RowOutcome;
  summary: { key: string; label: string }[];
  rowTitle: (r: RowValues) => { title: string; detail: string; sub?: string };
};

export const IMPORT_CONFIGS: Record<ImportKind, ImportConfig> = {
  parents: {
    templateFile: "verifygate-parents-template.csv",
    template: `parent_name,parent_email,parent_login_phone,parent_phone,default_password,child_name,child_class
Abena Mensah,abena@email.com,,0244123456,Parent@2025,Kofi Mensah,Primary 3
Abena Mensah,abena@email.com,,0244123456,Parent@2025,Ama Mensah,Primary 1
Kwame Asante,,0277654321,0277654321,Parent@2025,Yaw Asante,Primary 5`,
    intro:
      "Set up parents and their children from one spreadsheet. Each row is one child with their parent's details. To add a single parent instead, use the Parents page.",
    columns: [
      { name: "parent_name", when: "Optional", note: "The parent's full name. Leave it empty if you don't have it: it is saved as \"Parent of\" plus the child's name, e.g. \"Parent of Kofi Mensah\", and the parent corrects it when they first sign in." },
      { name: "parent_email", when: "Email or login phone", note: "What the parent signs in with. Fill in one or both." },
      { name: "parent_login_phone", when: "Email or login phone", note: "Any format works: 0244123456, 233244123456, +233 24 412 3456." },
      { name: "parent_phone", when: "Optional", note: "Where pickup SMS alerts go. Can be the same as the login phone." },
      { name: "default_password", when: "New parents", note: "At least 8 characters. Share it with the parent." },
      { name: "child_name", when: "Optional", note: "One child per row. Repeat the parent on another row for more children." },
      { name: "child_class", when: "Optional", note: "Your school's own class name, e.g. Primary 3, 3A or Adehye Class. A new name is added to your classes automatically; capital letters and spacing don't matter." },
    ],
    notes: [
      "Parents who already have an account only need their email or login phone plus the child. Their saved details won't change.",
      "Re-uploading the same file is safe. Parents and children already added are skipped, not duplicated.",
      "If a child is already on your student list and not yet linked, the row links that child instead of adding a second one. It matches on name and class; leave the class empty to match on name alone.",
    ],
    aliases: {
      name: "parent_name",
      email: "parent_email",
      login_phone: "parent_login_phone",
      phone: "parent_phone",
      sms_phone: "parent_phone",
      password: "default_password",
      student_name: "child_name",
      student: "child_name",
      child: "child_name",
      class: "child_class",
      student_class: "child_class",
      parent_email_or_phone: "parent_contact",
    },
    prepare: (r) => {
      const contact = r.parent_contact ?? "";
      return {
        ...r,
        parent_email: r.parent_email || (contact.includes("@") ? contact : ""),
        parent_login_phone: r.parent_login_phone || (contact && !contact.includes("@") ? contact : ""),
      };
    },
    precheck: (r) => (!r.parent_email && !r.parent_login_phone ? "Needs a parent_email or parent_login_phone." : null),
    endpoint: "/api/admin/bulk-import-parents",
    toBody: (r, schoolId) => ({
      schoolId,
      parentName: r.parent_name,
      parentEmail: r.parent_email,
      parentLoginPhone: r.parent_login_phone,
      parentPhone: r.parent_phone,
      password: r.default_password,
      childName: r.child_name,
      childClass: r.child_class,
    }),
    fieldToColumn: {
      parentName: "parent_name",
      parentEmail: "parent_email",
      parentLoginPhone: "parent_login_phone",
      parentPhone: "parent_phone",
      password: "default_password",
      childName: "child_name",
      childClass: "child_class",
    },
    interpret: (data) => {
      const nothingNew = !data.parentCreated && !data.childAdded;
      const parts = [
        data.parentCreated ? "Parent created" : "Existing parent",
        data.childLinked ? "child linked from your student list" : data.childAdded ? "child added" : data.childExisted ? "child already added" : null,
      ].filter(Boolean);
      return {
        status: nothingNew ? "skipped" : "ok",
        message: parts.join(", ") + (nothingNew ? " (nothing to change)" : ""),
        tally: [...(data.parentCreated ? ["parents"] : []), ...(data.childAdded ? ["children"] : [])],
      };
    },
    summary: [
      { key: "parents", label: "Parents created" },
      { key: "children", label: "Children added" },
    ],
    rowTitle: (r) => ({
      title: r.parent_name,
      detail: r.parent_email || r.parent_login_phone || "no email or phone",
      sub: r.child_name ? `Child: ${r.child_name}${r.child_class ? ` · ${r.child_class}` : ""}` : undefined,
    }),
  },

  students: {
    templateFile: "verifygate-students-template.csv",
    template: `student_name,student_class
Kofi Mensah,Primary 3
Ama Mensah,Primary 1
Yaw Asante,Primary 5`,
    intro:
      "Add your school's student list from one spreadsheet, one student per row. Link each child to a parent afterwards from the Parents page, or let the parents spreadsheet do it.",
    columns: [
      { name: "student_name", when: "Always", note: "The child's full name." },
      { name: "student_class", when: "Optional", note: "Your school's own class name, e.g. Primary 3, 3A or Adehye Class. A new name is added to your classes automatically; capital letters and spacing don't matter." },
    ],
    notes: [
      "Re-uploading the same file is safe. A student with the same name and class is skipped, not added twice.",
      "Two different children can share a name if they are in different classes.",
    ],
    aliases: {
      name: "student_name",
      child_name: "student_name",
      child: "student_name",
      student: "student_name",
      full_name: "student_name",
      class: "student_class",
      child_class: "student_class",
      grade: "student_class",
    },
    endpoint: "/api/admin/bulk-import-students",
    toBody: (r, schoolId) => ({ schoolId, studentName: r.student_name, studentClass: r.student_class }),
    fieldToColumn: { studentName: "student_name", studentClass: "student_class" },
    interpret: (data) =>
      data.created
        ? { status: "ok", message: "Student added", tally: ["students"] }
        : { status: "skipped", message: "Already on your student list (nothing to change)", tally: [] },
    summary: [{ key: "students", label: "Students added" }],
    rowTitle: (r) => ({
      title: r.student_name,
      detail: r.student_class || "no class",
    }),
  },

  staff: {
    templateFile: "verifygate-staff-template.csv",
    template: `name,email,login_phone,role,default_password
Kwame Asante,kwame@school.com,,guard,Guard@2026
Ama Owusu,,0244123456,teacher,Teacher@2026
Kofi Boateng,kofi@school.com,0277654321,teacher,Teacher@2026`,
    intro:
      "Add guards and on-duty teachers from one spreadsheet, one person per row. To add a single person instead, use the Staff page. Admins are added by VerifyGate.",
    columns: [
      { name: "name", when: "Always", note: "The person's full name." },
      { name: "email", when: "Email or login phone", note: "What they sign in with. Fill in one or both." },
      { name: "login_phone", when: "Email or login phone", note: "Any format works: 0244123456, 233244123456, +233 24 412 3456." },
      { name: "role", when: "Optional", note: "guard or teacher. Blank means guard. Teachers can scan pickups when on duty." },
      { name: "default_password", when: "New staff", note: "At least 8 characters. Share it with them." },
    ],
    notes: [
      "Re-uploading the same file is safe. People already added (same email or login phone) are skipped, and their details aren't changed.",
    ],
    aliases: {
      full_name: "name",
      staff_name: "name",
      phone: "login_phone",
      phone_number: "login_phone",
      password: "default_password",
      staff_role: "role",
    },
    precheck: (r) => (!r.email && !r.login_phone ? "Needs an email or login_phone." : null),
    endpoint: "/api/admin/bulk-import-staff",
    toBody: (r, schoolId) => ({
      schoolId,
      name: r.name,
      email: r.email,
      loginPhone: r.login_phone,
      role: r.role,
      password: r.default_password,
    }),
    fieldToColumn: {
      name: "name",
      email: "email",
      loginPhone: "login_phone",
      role: "role",
      password: "default_password",
    },
    interpret: (data) =>
      data.created
        ? { status: "ok", message: "Staff account created", tally: ["staff"] }
        : { status: "skipped", message: "Already on your staff (nothing to change)", tally: [] },
    summary: [{ key: "staff", label: "Staff added" }],
    rowTitle: (r) => ({
      title: r.name,
      detail: r.email || r.login_phone || "no email or phone",
      sub: `Role: ${(r.role || "guard").toLowerCase()}`,
    }),
  },
};
