import React from 'react';
import { useState } from 'react';
import EditMyInfoScreen from '../../components/settings/edit-my-info/EditMyInfoScreen';
import VerifyPasswordScreen from '../../components/settings/edit-my-info/VerifyPasswordScreen';
import Header from '../../components/common/header/Header';

const EditMyInfo = () => {
  const [isVerfied, setIsVerified] = useState<boolean>(false);

  return (
    <>
      <Header title="회원정보 수정" />
      {isVerfied ? <EditMyInfoScreen /> : <VerifyPasswordScreen setVerified={setIsVerified} />}
    </>
  );
};

export default EditMyInfo;
