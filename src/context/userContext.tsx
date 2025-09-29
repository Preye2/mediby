"use client";

import React, { createContext, useContext, useState } from "react";

export type UsersDetail = {
  name: string;
  email: string;
};

type CtxType = {
  userDetail: UsersDetail | null;
  setUserDetail: (u: UsersDetail) => void;
};

const UserDetailContext = createContext<CtxType>({
  userDetail: null,
  setUserDetail: () => {},
});

export function UserDetailProvider({ children }: { children: React.ReactNode }) {
  const [userDetail, setUserDetail] = useState<UsersDetail | null>(null);
  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      {children}
    </UserDetailContext.Provider>
  );
}

export const useUserDetail = () => useContext(UserDetailContext);