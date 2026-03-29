import { createBrowserRouter } from "react-router";
// import { LoginPage } from "./components/LoginPage";
import { SignUpPage } from "./components/SignUpPage";
import { UserPreferencesPage } from "./components/UserPreferencesPage";
import { MainPage } from "./components/MainPage";
import { DailyForumPage } from "./components/DailyForumPage";
import { MatchThreadsPage } from "./components/MatchThreadsPage";
import { TeamsPage } from "./components/TeamsPage";
import { UserAccountPage } from "./components/UserAccountPage";
import { ModerationPage } from "./components/ModerationPage";
import { ThreadSearchPage } from "./components/ThreadSearchPage"

export const router = createBrowserRouter([
  // {
  //   path: "/",
  //   Component: LoginPage,
  // },
  {
    path: "/signup",
    Component: SignUpPage,
  },
  {
    path: "/preferences",
    Component: UserPreferencesPage,
  },
  {
    path: "/main",
    Component: MainPage,
  },
  {
    path: "/daily-forum",
    Component: DailyForumPage,
  },
  {
    path: "/matches",
    Component: MatchThreadsPage,
  },
  {
    path: "/teams",
    Component: TeamsPage,
  },
  {
    path: "/user/:username",
    Component: UserAccountPage,
  },
  {
    path: "/account",
    Component: UserAccountPage,
  },
  {
    path: "/search",
    Component: ThreadSearchPage,
  },
  {
    path: "/moderation",
    Component: ModerationPage,
  },
]);