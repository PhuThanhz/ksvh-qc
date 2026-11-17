package vn.ksvh.qc.notification.service;

import vn.ksvh.qc.notification.domain.NotificationDispatch;

public interface NotificationChannelSender {

    boolean supports(String channel);

    void send(NotificationDispatch dispatch) throws Exception;
}
