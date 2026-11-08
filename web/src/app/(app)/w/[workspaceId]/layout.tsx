import {TaskflowApp} from "@/components/app-shell/taskflow-app";
// This application resolves its token session in the browser. Do not promise a
// prerendered instant-navigation shell before that client guard has resolved.
export const instant = false;
export default function WorkspaceLayout({children}:{children:React.ReactNode}){return <TaskflowApp>{children}</TaskflowApp>;}
